import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { DiditGateway } from '../src/instructor-applications/didit.gateway.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeDidit, signedDidit } from './fake-didit.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;

type TestUser = { id: string; cookie: string };

describe('Xác minh danh tính giảng viên (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const didit = new FakeDidit();
  const mail = { sendVerification: vi.fn(), sendResetPassword: vi.fn(), sendInstructorApplicationReviewed: vi.fn() };
  const emails: string[] = [];
  const base = '/api/instructor/application';

  const call = (method: 'get' | 'post' | 'put', path: string, cookie?: string) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    return cookie ? r.set('Cookie', cookie) : r;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (role = 'student'): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email').send({ name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role } });
    const res = await call('post', '/api/auth/sign-in/email').send({ email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };
  const sessionOf = async (userId: string) =>
    (await prisma.instructorApplication.findUniqueOrThrow({ where: { userId } })).identitySessionId!;
  const start = (u: TestUser, body: object = { consent: true }) => call('post', `${base}/identity/session`, u.cookie).send(body);
  const sync = (u: TestUser) => call('post', `${base}/identity/sync`, u.cookie);
  const hook = (payload: string, headers: Record<string, string>) =>
    request(app.getHttpServer()).post('/api/webhooks/didit').set('Content-Type', 'application/json').set(headers).send(payload);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue(mail)
      .overrideProvider(DiditGateway)
      .useValue(didit)
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  }, 120_000);

  // Xoá user → cascade đơn.
  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  }, 120_000);

  it('chưa tick đồng ý → 400 path consent', async () => {
    const u = await makeUser('student,instructor');
    const res = await start(u, {}).expect(400);
    expect(res.body.errors[0].path).toEqual(['consent']);
  });

  it('tạo phiên → url + pending; sync Approved → approved có tên; tạo lại → 409', async () => {
    const u = await makeUser('student,instructor');
    const { body } = await start(u).expect(200);
    expect(body.url).toMatch(/^https:\/\/verify\.didit\.test\/session\//);
    const sid = await sessionOf(u.id);
    expect((await call('get', base, u.cookie).expect(200)).body.identity).toEqual({ status: 'pending', name: null });

    didit.decide(sid, 'Approved', 'NGUYEN VAN A');
    const after = await sync(u).expect(200);
    expect(after.body.identity).toEqual({ status: 'approved', name: 'NGUYEN VAN A' });
    expect(after.body.missing.map((m: { step: string }) => m.step)).not.toContain('identity');
    expect((await start(u).expect(409)).body.code).toBe('IDENTITY_NOT_RESTARTABLE');
  });

  it('Declined → declined, tạo lại được phiên mới; In Review → in_review và chặn tạo lại', async () => {
    const u = await makeUser('student,instructor');
    await start(u).expect(200);
    const first = await sessionOf(u.id);
    didit.decide(first, 'Declined');
    expect((await sync(u).expect(200)).body.identity.status).toBe('declined');
    await start(u).expect(200);
    const second = await sessionOf(u.id);
    expect(second).not.toBe(first);
    didit.decide(second, 'In Review');
    expect((await sync(u).expect(200)).body.identity.status).toBe('in_review');
    expect((await start(u).expect(409)).body.code).toBe('IDENTITY_NOT_RESTARTABLE');
  });

  it('Expired → xoá phiên (null), làm lại được', async () => {
    const u = await makeUser('student,instructor');
    await start(u).expect(200);
    didit.decide(await sessionOf(u.id), 'Expired');
    expect((await sync(u).expect(200)).body.identity).toEqual({ status: null, name: null });
    expect((await prisma.instructorApplication.findUniqueOrThrow({ where: { userId: u.id } })).identitySessionId).toBeNull();
    await start(u).expect(200);
  });

  it('đã approved: Didit đổi sang Expired cũng không hạ trạng thái', async () => {
    const u = await makeUser('student,instructor');
    await start(u).expect(200);
    const sid = await sessionOf(u.id);
    didit.decide(sid, 'Approved', 'NGUYEN VAN B');
    await sync(u).expect(200);
    didit.decide(sid, 'Expired');
    const { body } = await sync(u).expect(200);
    expect(body.identity).toEqual({ status: 'approved', name: 'NGUYEN VAN B' });
  });

  it('submit chặn khi chưa approved, qua khi approved; đã gửi đơn thì tạo phiên → 409 APPLICATION_LOCKED', async () => {
    const u = await makeUser('student,instructor');
    // Đủ các bước khác bằng DB để test chỉ xoay quanh bước xác minh; ảnh là URL bất kỳ.
    await prisma.user.update({ where: { id: u.id }, data: { image: 'https://example.com/a.png' } });
    await start(u).expect(200);
    await prisma.instructorApplication.update({
      where: { userId: u.id },
      data: { headline: 'H', bio: 'B', termsAcceptedAt: new Date(), bankBin: '970436', bankAccountNo: '0123456789', bankAccountName: 'NGUYEN VAN E' },
    });
    const blocked = await call('post', `${base}/submit`, u.cookie).expect(400);
    expect(blocked.body.missing.map((m: { step: string }) => m.step)).toEqual(['identity']);
    didit.decide(await sessionOf(u.id), 'Approved', 'NGUYEN VAN E');
    await sync(u).expect(200);
    await call('post', `${base}/submit`, u.cookie).expect(200);
    expect((await start(u).expect(409)).body.code).toBe('APPLICATION_LOCKED');
  });

  it('sync khi chưa có phiên → 409; Didit lỗi khi tạo / sync → 502', async () => {
    const u = await makeUser('student,instructor');
    expect((await sync(u).expect(409)).body.code).toBe('NO_IDENTITY_SESSION');
    didit.failNext = true;
    expect((await start(u).expect(502)).body.code).toBe('IDENTITY_PROVIDER_ERROR');
    await start(u).expect(200);
    didit.failNext = true;
    expect((await sync(u).expect(502)).body.code).toBe('IDENTITY_PROVIDER_ERROR');
  });

  it('GET tự làm mới khi pending; PUT bước khác không gọi Didit', async () => {
    const u = await makeUser('student,instructor');
    await start(u).expect(200);
    didit.decide(await sessionOf(u.id), 'Approved', 'TRAN THI C');
    const before = didit.decisionCalls;
    await call('put', `${base}/terms`, u.cookie).send({ accepted: true }).expect(200);
    expect(didit.decisionCalls).toBe(before);
    expect((await call('get', base, u.cookie).expect(200)).body.identity.status).toBe('approved');
    expect(didit.decisionCalls).toBe(before + 1);
  });

  it('GET: Didit lỗi lúc làm mới → vẫn 200, giữ trạng thái cũ', async () => {
    const u = await makeUser('student,instructor');
    await start(u).expect(200);
    didit.failNext = true;
    expect((await call('get', base, u.cookie).expect(200)).body.identity.status).toBe('pending');
  });

  describe('webhook', () => {
    it('đúng chữ ký → cập nhật đơn', async () => {
      const u = await makeUser('student,instructor');
      await start(u).expect(200);
      const sid = await sessionOf(u.id);
      didit.decide(sid, 'Approved', 'LE VAN D');
      const { payload, headers } = signedDidit({ webhook_type: 'status.updated', session_id: sid, status: 'Approved' });
      await hook(payload, headers).expect(200);
      const row = await prisma.instructorApplication.findUniqueOrThrow({ where: { userId: u.id } });
      expect(row).toMatchObject({ identityStatus: 'approved', identityName: 'LE VAN D' });
    });

    it('sai chữ ký / sai độ dài / timestamp trong body lệch giờ / thiếu header → 401', async () => {
      const { payload, headers } = signedDidit({ session_id: 'x' });
      await hook(payload, { ...headers, 'X-Signature': 'f'.repeat(64) }).expect(401);
      await hook(payload, { ...headers, 'X-Signature': 'abc' }).expect(401);
      const old = signedDidit({ session_id: 'x' }, Math.floor(Date.now() / 1000) - 301);
      await hook(old.payload, old.headers).expect(401);
      await hook(payload, {}).expect(401);
    });

    it('phiên không gắn đơn nào → 200, không gọi Didit', async () => {
      const before = didit.decisionCalls;
      const { payload, headers } = signedDidit({ session_id: '00000000-0000-0000-0000-000000000000' });
      await hook(payload, headers).expect(200);
      expect(didit.decisionCalls).toBe(before);
    });

    it('Didit lỗi khi lấy kết quả → 500 để Didit gửi lại', async () => {
      const u = await makeUser('student,instructor');
      await start(u).expect(200);
      const { payload, headers } = signedDidit({ session_id: await sessionOf(u.id) });
      didit.failNext = true;
      await hook(payload, headers).expect(500);
    });
  });
});
