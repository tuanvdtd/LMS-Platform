import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const BANK = { bankBin: '970436', bankAccountNo: '0123456789', bankAccountName: 'NGUYEN VAN A' };
// Kỳ cũ cố định để không đụng dữ liệu dev hiện tại.
const PERIOD = '2020-01';

type TestUser = { id: string; cookie: string };

describe('Revenue & payouts (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let admin: TestUser;
  let rich: TestUser; // giảng viên đủ ngưỡng
  let poor: TestUser; // giảng viên dưới ngưỡng
  let unverified: TestUser; // có role instructor, chưa có instructor_profiles
  let student: TestUser;
  let richCourseId: string;
  let poorCourseId: string;

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
  const makeCourse = (instructorId: string) =>
    prisma.course
      .create({ data: { instructorId, title: 'E2E', slug: `e2e-${randomUUID()}`, priceAmount: 500_000 } })
      .then((c) => c.id);
  // Một order paid, một item. earn tính sẵn 70%.
  const sell = async (courseId: string, instructorId: string, unit: number, paidAt: Date, refunded = false) => {
    const earn = Math.floor((unit * 70) / 100);
    const order = await prisma.order.create({
      data: {
        userId: student.id,
        status: 'paid',
        subtotalAmount: unit,
        totalAmount: unit,
        paidAt,
        items: {
          create: {
            courseId,
            instructorId,
            listPriceAmount: unit,
            unitPriceAmount: unit,
            instructorEarnAmount: earn,
            platformFeeAmount: unit - earn,
            refundedAt: refunded ? new Date() : null,
          },
        },
      },
    });
    return order.id;
  };
  const myPayouts = (instructorId: string) => prisma.payout.findMany({ where: { instructorId } });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    [admin, rich, poor, unverified, student] = await Promise.all([
      makeUser('student,admin'),
      makeUser('student,instructor'),
      makeUser('student,instructor'),
      makeUser('student,instructor'),
      makeUser(),
    ]);
    await prisma.instructorProfile.createMany({
      data: [{ userId: rich.id, ...BANK }, { userId: poor.id, ...BANK }],
    });
    [richCourseId, poorCourseId] = await Promise.all([makeCourse(rich.id), makeCourse(poor.id)]);
  }, 120_000);

  // Dọn: orders (cascade items, gỡ FK payoutId) → payouts → courses → users.
  afterAll(async () => {
    const ids = [admin, rich, poor, unverified, student].filter(Boolean).map((u) => u.id);
    await prisma?.order.deleteMany({ where: { userId: { in: ids } } });
    await prisma?.payout.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  }, 120_000);

  describe('payout-account', () => {
    it('chưa xác minh → GET verified=false; PUT → 403', async () => {
      const res = await call('get', '/api/instructor/payout-account', unverified.cookie).expect(200);
      expect(res.body).toEqual({ verified: false, account: null });
      const put = await call('put', '/api/instructor/payout-account', unverified.cookie).send(BANK).expect(403);
      expect(put.body.code).toBe('INSTRUCTOR_NOT_VERIFIED');
    });

    it('PUT chuẩn hoá tên chủ TK', async () => {
      const res = await call('put', '/api/instructor/payout-account', rich.cookie)
        .send({ ...BANK, bankAccountName: '  Nguyễn  Văn Đức ' })
        .expect(200);
      expect(res.body).toEqual({ verified: true, account: { ...BANK, bankAccountName: 'NGUYEN VAN DUC' } });
    });

    it('số TK sai → 400 theo trường', async () => {
      const res = await call('put', '/api/instructor/payout-account', rich.cookie)
        .send({ ...BANK, bankAccountNo: '12ab' })
        .expect(400);
      expect(res.body.errors[0].path).toEqual(['bankAccountNo']);
    });

    it('học viên → 403', () => call('get', '/api/instructor/payout-account', student.cookie).expect(403));
  });

  describe('admin settings', () => {
    let original: number;
    beforeAll(async () => {
      original = (await call('get', '/api/admin/settings/revenue-share', admin.cookie).expect(200)).body.sharePct;
    });
    afterAll(() => call('put', '/api/admin/settings/revenue-share', admin.cookie).send({ sharePct: original }));

    it('giảng viên gọi API admin → 403', () =>
      call('get', '/api/admin/settings/revenue-share', rich.cookie).expect(403));

    it('đọc / sửa tỷ lệ, ngoài 0–100 → 400', async () => {
      const target = original === 65 ? 66 : 65;
      const put = await call('put', '/api/admin/settings/revenue-share', admin.cookie).send({ sharePct: target }).expect(200);
      expect(put.body.sharePct).toBe(target);
      const get = await call('get', '/api/admin/settings/revenue-share', admin.cookie).expect(200);
      expect(get.body.sharePct).toBe(target);
      await call('put', '/api/admin/settings/revenue-share', admin.cookie).send({ sharePct: 101 }).expect(400);
    });
  });

  describe('chốt kỳ + trả tiền', () => {
    let payoutId: string;

    beforeAll(async () => {
      // rich: 2 item trong kỳ (350k + 140k), 1 item đã hoàn, 1 item tháng sau.
      await sell(richCourseId, rich.id, 500_000, new Date('2020-01-10T03:00:00Z'));
      await sell(richCourseId, rich.id, 200_000, new Date('2020-01-31T16:59:00Z')); // 23:59 giờ VN
      await sell(richCourseId, rich.id, 500_000, new Date('2020-01-15T03:00:00Z'), true);
      await sell(richCourseId, rich.id, 500_000, new Date('2020-01-31T17:00:00Z')); // 00:00 1/2 giờ VN
      // poor: 140k < ngưỡng 200k
      await sell(poorCourseId, poor.id, 200_000, new Date('2020-01-10T03:00:00Z'));
    }, 120_000);

    it('tháng hiện tại → 400', async () => {
      const now = new Date(Date.now() + 7 * 3600_000);
      const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      await call('post', '/api/admin/payouts/close-period', admin.cookie).send({ period }).expect(400);
    });

    it('gom đúng item theo kỳ, bỏ item đã hoàn, bỏ nhóm dưới ngưỡng', async () => {
      await call('post', '/api/admin/payouts/close-period', admin.cookie).send({ period: PERIOD }).expect(200);
      const [p] = await myPayouts(rich.id);
      expect(p).toMatchObject({ period: PERIOD, amount: 490_000, status: 'pending', ...BANK, bankAccountName: 'NGUYEN VAN DUC' });
      payoutId = p.id;
      expect(await prisma.orderItem.count({ where: { payoutId } })).toBe(2);
      expect(await myPayouts(poor.id)).toHaveLength(0);
    }, 60_000);

    it('summary giảng viên khớp', async () => {
      const res = await call('get', '/api/instructor/earnings/summary', rich.cookie).expect(200);
      expect(res.body).toMatchObject({ unsettled: 350_000, pending: 490_000, paid: 0 });
    });

    it('chốt lại cùng kỳ: không tạo trùng, item mới trong kỳ cộng vào payout pending', async () => {
      await sell(richCourseId, rich.id, 300_000, new Date('2020-01-20T03:00:00Z')); // earn 210k
      await call('post', '/api/admin/payouts/close-period', admin.cookie).send({ period: PERIOD }).expect(200);
      const list = await myPayouts(rich.id);
      expect(list).toHaveLength(1);
      expect(list[0].amount).toBe(700_000);
    }, 60_000);

    it('chi tiết payout có qrUrl; id sai dạng → 404', async () => {
      const res = await call('get', `/api/admin/payouts/${payoutId}`, admin.cookie).expect(200);
      expect(res.body.qrUrl).toContain('img.vietqr.io/image/970436-0123456789');
      expect(res.body.items).toHaveLength(3);
      await call('get', '/api/admin/payouts/not-a-uuid', admin.cookie).expect(404);
    });

    it('mark-paid → paid; lần 2 → 409; summary chuyển sang paid', async () => {
      const res = await call('post', `/api/admin/payouts/${payoutId}/mark-paid`, admin.cookie)
        .send({ bankTxnRef: 'FT123' })
        .expect(200);
      expect(res.body).toMatchObject({ status: 'paid', bankTxnRef: 'FT123', qrUrl: null });
      const again = await call('post', `/api/admin/payouts/${payoutId}/mark-paid`, admin.cookie).send({}).expect(409);
      expect(again.body.code).toBe('PAYOUT_ALREADY_PAID');
      const sum = await call('get', '/api/instructor/earnings/summary', rich.cookie).expect(200);
      expect(sum.body).toMatchObject({ pending: 0, paid: 700_000 });
    }, 60_000);

    it('lịch sử payout của giảng viên + danh sách admin lọc theo kỳ', async () => {
      const mine = await call('get', '/api/instructor/payouts', rich.cookie).expect(200);
      expect(mine.body.items).toHaveLength(1);
      const all = await call('get', `/api/admin/payouts?period=${PERIOD}&status=paid`, admin.cookie).expect(200);
      expect(all.body.items.some((p: { id: string }) => p.id === payoutId)).toBe(true);
    });

    it('học viên gọi API admin → 403', () => call('get', '/api/admin/payouts', student.cookie).expect(403));
  });
});
