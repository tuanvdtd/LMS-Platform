import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { HlsService } from '../src/hls/hls.service.js';
import { MediaConvertGateway } from '../src/hls/mediaconvert.gateway.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { StorageService } from '../src/infra/storage.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeMediaConvert } from './fake-mediaconvert.js';
import { FakeStorage } from './fake-storage.js';
import { mp4 } from './fixtures/files.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const SECRET = 'e2e-mediaconvert-secret';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const SLOW = 120_000;

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'put';

describe('Video HLS qua MediaConvert (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const storage = new FakeStorage();
  const mc = new FakeMediaConvert();
  const emails: string[] = [];
  let alice: TestUser;

  const call = (method: Method, path: string, cookie?: string, body?: object) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    const withCookie = cookie ? r.set('Cookie', cookie) : r;
    return body ? withCookie.send(body) : withCookie;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email', undefined, { name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role: 'student,instructor' } });
    const res = await call('post', '/api/auth/sign-in/email', undefined, { email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };
  // Ký upload, "PUT" vào FakeStorage, gọi complete, kiểm mã trả về.
  const complete = async (body: Buffer, expected: number) => {
    const ticket = await call('post', '/api/instructor/assets/uploads', alice.cookie, {
      kind: 'video',
      fileName: 'bai.mp4',
      mimeType: 'video/mp4',
      sizeBytes: body.length,
      durationSec: 600,
    }).expect(201);
    storage.put('video', ticket.body.key, body);
    return call('post', `/api/instructor/assets/${ticket.body.assetId}/complete`, alice.cookie).expect(expected);
  };
  const webhook = (jobId: string, status: string, secret = SECRET) =>
    call('post', '/api/webhooks/mediaconvert')
      .set('x-mediaconvert-secret', secret)
      .send({ source: 'aws.mediaconvert', detail: { jobId, status } });
  const assetOf = (id: string) => prisma.asset.findUniqueOrThrow({ where: { id } });

  beforeAll(async () => {
    vi.stubEnv('MEDIACONVERT_ROLE_ARN', 'arn:aws:iam::000000000000:role/e2e');
    vi.stubEnv('MEDIACONVERT_WEBHOOK_SECRET', SECRET);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .overrideProvider(StorageService)
      .useValue(storage)
      .overrideProvider(MediaConvertGateway)
      .useValue(mc)
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    alice = await makeUser();
  }, SLOW);

  afterAll(async () => {
    const ids = alice ? [alice.id] : [];
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
    vi.unstubAllEnvs();
  });

  it('complete video 1080p → processing + job đủ 3 rendition, có audio', async () => {
    const res = await complete(mp4(10), 200);
    expect(res.body.status).toBe('processing');
    const asset = await assetOf(res.body.id);
    expect(asset).toMatchObject({ status: 'processing', hlsKey: null });
    const job = mc.jobs.get(asset.hlsJobId!)!;
    const outs = job.input.Settings!.OutputGroups![0].Outputs!;
    expect(outs.map((o) => o.VideoDescription?.Height)).toEqual([1080, 720, 480]);
    expect(job.input.Settings!.Inputs![0].AudioSelectors).toBeDefined();
    expect(job.input.UserMetadata).toEqual({ assetId: asset.id });
  });

  it('video dọc / xoay 90° / dưới 720p → 400, asset failed, không gửi job', async () => {
    const before = mc.jobs.size;
    const portrait = await complete(mp4(10, { video: { width: 1080, height: 1920 } }), 400);
    expect(portrait.body.errors[0].message).toBe('Chỉ nhận video ngang');
    await complete(mp4(10, { video: { width: 1920, height: 1080, rotate: 90 } }), 400);
    const small = await complete(mp4(10, { video: { width: 854, height: 480 } }), 400);
    expect(small.body.errors[0].message).toBe('Video phải từ 720p trở lên');
    expect(mc.jobs.size).toBe(before);
  });

  it('webhook: sai secret 401; COMPLETE → ready + hlsKey, URL HLS; lặp lại không đổi', async () => {
    const { body } = await complete(mp4(10), 200);
    const { hlsJobId } = await assetOf(body.id);
    await webhook(hlsJobId!, 'COMPLETE', 'sai').expect(401);
    expect((await assetOf(body.id)).status).toBe('processing');
    // processing chưa có URL xem lại
    await call('get', `/api/instructor/assets/${body.id}/url`, alice.cookie).expect(404);

    await webhook(hlsJobId!, 'COMPLETE').expect(200);
    const done = await assetOf(body.id);
    expect(done).toMatchObject({ status: 'ready', hlsKey: `hls/${body.id}/index.m3u8` });
    const view = await call('get', `/api/instructor/assets/${body.id}/url`, alice.cookie).expect(200);
    expect(new URL(view.body.url as string).pathname).toBe(`/hls/${body.id}/index.m3u8`);

    await webhook(hlsJobId!, 'COMPLETE').expect(200);
    expect((await assetOf(body.id)).updatedAt).toEqual(done.updatedAt);
  });

  it('webhook ERROR: upload mới → failed; backfill (ready) → giữ ready, bỏ hlsJobId', async () => {
    const { body } = await complete(mp4(10), 200);
    const { hlsJobId } = await assetOf(body.id);
    await webhook(hlsJobId!, 'ERROR').expect(200);
    expect(await assetOf(body.id)).toMatchObject({ status: 'failed', hlsJobId: null, hlsKey: null });

    const old = await prisma.asset.create({
      data: {
        ownerId: alice.id,
        kind: 'video',
        fileName: 'cu.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 1000,
        storageKey: `videos/${alice.id}/${randomUUID()}.mp4`,
        status: 'ready',
        hlsJobId: `fake-backfill-${randomUUID()}`,
      },
    });
    await webhook(old.hlsJobId!, 'ERROR').expect(200);
    expect(await assetOf(old.id)).toMatchObject({ status: 'ready', hlsJobId: null, hlsKey: null });
  });

  it('webhook body sai shape → 400; job không thuộc asset nào → 200, không làm gì', async () => {
    await call('post', '/api/webhooks/mediaconvert').set('x-mediaconvert-secret', SECRET).send({ detail: {} }).expect(400);
    await webhook(`fake-unknown-${randomUUID()}`, 'COMPLETE').expect(200);
  });

  it('đối soát: job COMPLETE mà webhook mất → asset ready', async () => {
    const { body } = await complete(mp4(10), 200);
    const { hlsJobId } = await assetOf(body.id);
    mc.jobs.get(hlsJobId!)!.status = 'COMPLETE';
    // Gọi thẳng: lúc khởi động đối soát chạy nền (void), test cần kết quả xác định.
    await app.get(HlsService).reconcile();
    expect(await assetOf(body.id)).toMatchObject({ status: 'ready', hlsKey: `hls/${body.id}/index.m3u8` });
  });

  it('gắn video processing vào bài được; checklist chặn gửi duyệt', async () => {
    const courseId = (
      await call('post', '/api/instructor/courses', alice.cookie, { title: 'Khoá e2e HLS' }).expect(201)
    ).body.id as string;
    const as = (method: Method, path: string, b?: object) =>
      call(method, `/api/instructor/courses/${courseId}${path}`, alice.cookie, b);
    const tree = (await as('get', '/curriculum').expect(200)).body;
    const lecture = tree.sections[0].items.find((i: { type: string }) => i.type === 'lecture');
    const { body } = await complete(mp4(10), 200);

    const after = (await as('put', `/items/${lecture.id}/content`, { assetId: body.id }).expect(200)).body;
    const item = after.sections[0].items.find((i: { id: string }) => i.id === lecture.id);
    expect(item.video).toMatchObject({ id: body.id, status: 'processing' });
    const curriculum = after.checklist.find((c: { key: string }) => c.key === 'curriculum');
    expect(curriculum.missing.map((m: { message: string }) => m.message)).toContain(
      'Còn 1 video đang xử lý, đợi xử lý xong rồi gửi duyệt',
    );
    // Gửi duyệt dùng cùng checklist → 400.
    const submit = await as('post', '/submit', { copyrightConfirmed: true });
    expect(submit.status).toBe(400);
    expect(submit.body.code).toBe('CHECKLIST_INCOMPLETE');
  });

  it('khoá đang bán chỉ nhận video ready: processing → 400, xử lý xong → gắn được', async () => {
    const courseId = (
      await call('post', '/api/instructor/courses', alice.cookie, { title: 'Khoá e2e HLS đang bán' }).expect(201)
    ).body.id as string;
    await prisma.course.update({ where: { id: courseId }, data: { status: 'published', publishedAt: new Date() } });
    const as = (method: Method, path: string, b?: object) =>
      call(method, `/api/instructor/courses/${courseId}${path}`, alice.cookie, b);
    const tree = (await as('get', '/curriculum').expect(200)).body;
    const lecture = tree.sections[0].items.find((i: { type: string }) => i.type === 'lecture');
    const { body } = await complete(mp4(10), 200);

    const res = await as('put', `/items/${lecture.id}/content`, { assetId: body.id }).expect(400);
    expect(res.body.errors[0].message).toBe('Video đang xử lý, đợi xử lý xong rồi gắn vào bài (khoá đang bán)');

    await webhook((await assetOf(body.id)).hlsJobId!, 'COMPLETE').expect(200);
    await as('put', `/items/${lecture.id}/content`, { assetId: body.id }).expect(200);
  });
});
