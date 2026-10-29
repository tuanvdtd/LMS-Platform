import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { StorageService } from '../src/infra/storage.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeStorage } from './fake-storage.js';
import { png } from './fixtures/files.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const BANK = { bankBin: '970436', bankAccountNo: '0123456789', bankAccountName: 'NGUYEN VAN A' };
const BIO = Array(50).fill('từ').join(' ');
const INFO = { name: 'Nguyễn Văn A', headline: 'Senior Backend', bio: BIO, socials: { github: 'https://github.com/e2e' } };
const SLOW = 60_000;

type TestUser = { id: string; cookie: string };
type Step = 'info' | 'avatar' | 'terms' | 'payout';

describe('Đơn giảng viên cao cấp (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const storage = new FakeStorage();
  const mail = { sendVerification: vi.fn(), sendResetPassword: vi.fn(), sendInstructorApplicationReviewed: vi.fn() };
  const emails: string[] = [];
  let admin: TestUser;
  let moderator: TestUser;
  let teacher: TestUser; // đi hết vòng đời đơn
  let other: TestUser; // instructor khác: ảnh của người này dùng để thử key lạ
  let legacy: TestUser; // đã cao cấp bằng luồng cũ (có profile, không có đơn)
  let student: TestUser;
  let appId: string;

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
  const step = (u: TestUser, s: Step, body: object) => call('put', `/api/instructor/application/${s}`, u.cookie).send(body);
  const submit = (u: TestUser) => call('post', '/api/instructor/application/submit', u.cookie);
  // Ký URL rồi "upload" thẳng vào FakeStorage (thay trình duyệt PUT).
  const uploadAvatar = async (u: TestUser, body: Buffer) => {
    const res = await call('post', '/api/instructor/assets/uploads', u.cookie)
      .send({ kind: 'avatar', fileName: 'a.png', mimeType: 'image/png', sizeBytes: body.length })
      .expect(201);
    storage.put('public', res.body.key, body);
    return res.body.key as string;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue(mail)
      .overrideProvider(StorageService)
      .useValue(storage)
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    [admin, moderator, teacher, other, legacy, student] = await Promise.all([
      makeUser('student,admin'),
      makeUser('moderator'),
      makeUser('student,instructor'),
      makeUser('student,instructor'),
      makeUser('student,instructor'),
      makeUser(),
    ]);
    await prisma.instructorProfile.create({ data: { userId: legacy.id, headline: 'Cũ', ...BANK } });
  }, 120_000);

  // Xoá user → cascade đơn + profile; reviewedById SetNull.
  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  }, 120_000);

  describe('giảng viên', () => {
    it('chưa có đơn: displayStatus none, thiếu đủ 4 bước', async () => {
      const { body } = await call('get', '/api/instructor/application', teacher.cookie).expect(200);
      expect(body).toMatchObject({ displayStatus: 'none', name: 'E2E', image: null, bank: null, revenueSharePct: expect.any(Number) });
      expect(body.missing.map((m: { step: string }) => m.step)).toEqual(['info', 'avatar', 'terms', 'payout']);
    });

    it('submit khi chưa có đơn → 400 APPLICATION_INCOMPLETE', async () => {
      const res = await submit(teacher).expect(400);
      expect(res.body.code).toBe('APPLICATION_INCOMPLETE');
      expect(res.body.missing).toHaveLength(4);
    });

    it('info: bio 49 từ → 400 path bio', async () => {
      const res = await step(teacher, 'info', { ...INFO, bio: Array(49).fill('từ').join(' ') }).expect(400);
      expect(res.body.errors[0].path).toEqual(['bio']);
    });

    it('info hợp lệ → draft, tên ghi vào user', async () => {
      const { body } = await step(teacher, 'info', INFO).expect(200);
      expect(body).toMatchObject({ displayStatus: 'draft', name: 'Nguyễn Văn A', headline: 'Senior Backend', website: null });
      const user = await prisma.user.findUniqueOrThrow({ where: { id: teacher.id } });
      expect(user.name).toBe('Nguyễn Văn A');
    });

    it('submit thiếu bước → 400 kèm missing đúng bước', async () => {
      const res = await submit(teacher).expect(400);
      expect(res.body.missing.map((m: { step: string }) => m.step)).toEqual(['avatar', 'terms', 'payout']);
    });

    it(
      'avatar: key người khác → 400 không xoá; ảnh nhỏ → 400 + xoá; hợp lệ → user.image; thay → xoá ảnh cũ',
      async () => {
        const foreign = await uploadAvatar(other, png(400, 400));
        await step(teacher, 'avatar', { key: foreign }).expect(400);
        expect(storage.has('public', foreign)).toBe(true);

        const small = await uploadAvatar(teacher, png(100, 100));
        const res = await step(teacher, 'avatar', { key: small }).expect(400);
        expect(res.body.errors[0].message).toBe('Ảnh tối thiểu 200×200 px');
        expect(storage.has('public', small)).toBe(false);

        const first = await uploadAvatar(teacher, png(200, 200));
        const a = await step(teacher, 'avatar', { key: first }).expect(200);
        expect(a.body.image).toBe(`${FakeStorage.PUBLIC}/${first}`);

        const second = await uploadAvatar(teacher, png(300, 300));
        await step(teacher, 'avatar', { key: second }).expect(200);
        expect(storage.has('public', first)).toBe(false);
      },
      SLOW,
    );

    it('terms + payout → missing rỗng', async () => {
      await step(teacher, 'terms', { accepted: false }).expect(400);
      await step(teacher, 'terms', { accepted: true }).expect(200);
      const { body } = await step(teacher, 'payout', BANK).expect(200);
      expect(body).toMatchObject({ termsAccepted: true, bank: BANK, missing: [] });
    });

    it('submit → pending; sửa / nộp lại → 409 APPLICATION_LOCKED', async () => {
      const { body } = await submit(teacher).expect(200);
      expect(body).toMatchObject({ displayStatus: 'pending', submittedAt: expect.any(String) });
      expect((await step(teacher, 'info', INFO).expect(409)).body.code).toBe('APPLICATION_LOCKED');
      expect((await submit(teacher).expect(409)).body.code).toBe('APPLICATION_LOCKED');
      const k = await uploadAvatar(teacher, png(300, 300));
      expect((await step(teacher, 'avatar', { key: k }).expect(409)).body.code).toBe('APPLICATION_LOCKED');
      expect(storage.has('public', k)).toBe(false);
      appId = (await prisma.instructorApplication.findUniqueOrThrow({ where: { userId: teacher.id } })).id;
    });

    it('đã cao cấp từ luồng cũ: GET approved, PUT → 409 ALREADY_PREMIUM', async () => {
      const { body } = await call('get', '/api/instructor/application', legacy.cookie).expect(200);
      expect(body).toMatchObject({ displayStatus: 'approved', missing: [] });
      expect((await step(legacy, 'info', INFO).expect(409)).body.code).toBe('ALREADY_PREMIUM');
    });

    it('better-auth update-user bị tắt', async () => {
      await call('post', '/api/auth/update-user', teacher.cookie).send({ name: 'Hack' }).expect(404);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: teacher.id } })).name).not.toBe('Hack');
    });

    it('học viên / moderator → 403', async () => {
      await call('get', '/api/instructor/application', student.cookie).expect(403);
      await call('get', '/api/instructor/application', moderator.cookie).expect(403);
    });
  });
  describe('admin', () => {
    const base = '/api/admin/instructor-applications';

    it('moderator / giảng viên → 403', async () => {
      await call('get', base, moderator.cookie).expect(403);
      await call('get', base, teacher.cookie).expect(403);
    });

    it('danh sách pending có đơn; chi tiết chỉ có số TK đã che', async () => {
      const list = await call('get', base, admin.cookie).expect(200);
      expect(list.body.items.map((i: { id: string }) => i.id)).toContain(appId);
      const { body } = await call('get', `${base}/${appId}`, admin.cookie).expect(200);
      expect(body).toMatchObject({ status: 'pending', bankAccountNoMasked: '••••6789', courseCount: 0 });
      expect(body).not.toHaveProperty('bankAccountNo');
    });

    it('id sai định dạng → 404', () => call('get', `${base}/abc`, admin.cookie).expect(404));

    it('từ chối → rejected + mail; giảng viên thấy lý do', async () => {
      await call('post', `${base}/${appId}/reject`, admin.cookie).send({ reason: '' }).expect(400);
      const { body } = await call('post', `${base}/${appId}/reject`, admin.cookie).send({ reason: 'Ảnh mờ' }).expect(200);
      expect(body).toMatchObject({ status: 'rejected', rejectReason: 'Ảnh mờ' });
      expect(mail.sendInstructorApplicationReviewed).toHaveBeenLastCalledWith(expect.any(String), false, 'Ảnh mờ');
      const view = await call('get', '/api/instructor/application', teacher.cookie).expect(200);
      expect(view.body).toMatchObject({ displayStatus: 'rejected', rejectReason: 'Ảnh mờ' });
    });

    it('sửa sau khi bị từ chối → draft giữ lý do; nộp lại → pending, xoá lý do', async () => {
      const { body } = await step(teacher, 'terms', { accepted: true }).expect(200);
      expect(body).toMatchObject({ displayStatus: 'draft', rejectReason: 'Ảnh mờ' });
      // Đơn nháp coi như không tồn tại với admin.
      await call('get', `${base}/${appId}`, admin.cookie).expect(404);
      const again = await submit(teacher).expect(200);
      expect(again.body).toMatchObject({ displayStatus: 'pending', rejectReason: null });
    });

    it('duyệt khi user đã có profile → 409 ALREADY_PREMIUM, rollback giữ pending + bank', async () => {
      const row = await prisma.instructorApplication.create({
        data: {
          userId: legacy.id,
          status: 'pending',
          headline: 'X',
          bio: BIO,
          termsAcceptedAt: new Date(),
          submittedAt: new Date(),
          ...BANK,
        },
      });
      const res = await call('post', `${base}/${row.id}/approve`, admin.cookie).expect(409);
      expect(res.body.code).toBe('ALREADY_PREMIUM');
      const after = await prisma.instructorApplication.findUniqueOrThrow({ where: { id: row.id } });
      expect(after).toMatchObject({ status: 'pending', bankAccountNo: BANK.bankAccountNo });
    });

    it('duyệt uuid hợp lệ nhưng không tồn tại → 404', () =>
      call('post', `${base}/${randomUUID()}/approve`, admin.cookie).expect(404));

    it(
      'duyệt → tạo profile từ đơn, xoá bank của đơn, mail; duyệt lần 2 → 409; đặt giá trả phí được',
      async () => {
        const { body } = await call('post', `${base}/${appId}/approve`, admin.cookie).expect(200);
        expect(body.status).toBe('approved');
        expect(mail.sendInstructorApplicationReviewed).toHaveBeenLastCalledWith(expect.any(String), true, null);

        const profile = await prisma.instructorProfile.findUniqueOrThrow({ where: { userId: teacher.id } });
        expect(profile).toMatchObject({ headline: 'Senior Backend', bio: BIO, socials: INFO.socials, ...BANK });
        const row = await prisma.instructorApplication.findUniqueOrThrow({ where: { id: appId } });
        expect(row).toMatchObject({ bankBin: null, bankAccountNo: null, bankAccountName: null, reviewedById: admin.id });

        const second = await call('post', `${base}/${appId}/approve`, admin.cookie).expect(409);
        expect(second.body.code).toBe('APPLICATION_NOT_PENDING');
        // Từ chối đơn đã duyệt cũng bị chặn.
        const late = await call('post', `${base}/${appId}/reject`, admin.cookie).send({ reason: 'Muộn' }).expect(409);
        expect(late.body.code).toBe('APPLICATION_NOT_PENDING');

        const view = await call('get', '/api/instructor/application', teacher.cookie).expect(200);
        expect(view.body.displayStatus).toBe('approved');

        const course = await call('post', '/api/instructor/courses', teacher.cookie).send({ title: 'Khoá trả phí' }).expect(201);
        await call('put', `/api/instructor/courses/${course.body.id}/price`, teacher.cookie)
          .send({ priceAmount: 199_000 })
          .expect(200);
        await prisma.course.delete({ where: { id: course.body.id } });
      },
      SLOW,
    );
  });
});
