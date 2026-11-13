import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { SERIAL_RE } from '../src/certificates/serial.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { StorageService } from '../src/infra/storage.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeStorage } from './fake-storage.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const SLOW = 120_000; // DB dev ~1-2s/query

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
type Tree = { sections: { id: string; items: { id: string }[] }[] };

describe('Chứng chỉ (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let alice: TestUser; // giảng viên
  let stu: TestUser; // học viên học hết khoá
  let carol: TestUser; // học viên khác, chưa học bài nào
  let courseId: string;
  let slug: string;
  let sectionId: string;
  let a: string; // 2 bài đọc đã xuất bản
  let b: string;
  let serial: string;

  const call = (method: Method, path: string, cookie?: string, body?: object) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    const withCookie = cookie ? r.set('Cookie', cookie) : r;
    return body ? withCookie.send(body) : withCookie;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (name: string): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email', undefined, { name, email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role: 'student,instructor' } });
    const res = await call('post', '/api/auth/sign-in/email', undefined, { email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };
  const learn = (method: Method, path = '', user = stu) => call(method, `/api/learn/${slug}${path}`, user.cookie);
  const certCount = () => prisma.certificate.count({ where: { userId: stu.id, courseId } });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .overrideProvider(StorageService)
      .useValue(new FakeStorage())
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    [alice, stu, carol] = await Promise.all([makeUser('Trần Quốc Bảo'), makeUser('Nguyễn Thị Minh Anh'), makeUser('Carol')]);
    courseId = (await call('post', '/api/instructor/courses', alice.cookie, { title: 'Khoá e2e chứng chỉ' }).expect(201)).body
      .id as string;
    const as = (path: string, body: object) => call('post', `/api/instructor/courses/${courseId}${path}`, alice.cookie, body);
    sectionId = ((await as('/sections', { title: 'Phần 1' }).expect(201)).body as Tree).sections[0].id;
    const add = async (title: string) =>
      ((await as(`/sections/${sectionId}/items`, { type: 'lecture', title }).expect(201)).body as Tree).sections[0].items.at(-1)!.id;
    a = await add('Bài 1');
    b = await add('Bài 2');
    // Gắn nội dung thẳng bằng Prisma (bỏ qua luồng upload) — thoả ràng buộc nội dung của item.
    for (const id of [a, b]) {
      const asset = await prisma.asset.create({
        data: {
          ownerId: alice.id,
          kind: 'document',
          fileName: 'bai-doc.pdf',
          mimeType: 'application/pdf',
          sizeBytes: BigInt(1024),
          storageKey: `e2e/${randomUUID()}.pdf`,
          status: 'ready',
        },
      });
      await prisma.curriculumItem.update({ where: { id }, data: { lectureKind: 'document', documentAssetId: asset.id, isPublished: true } });
    }
    slug = (await prisma.course.update({ where: { id: courseId }, data: { status: 'published' }, select: { slug: true } })).slug;
    await prisma.enrollment.createMany({ data: [{ userId: stu.id, courseId }, { userId: carol.id, courseId }] });
  }, SLOW);

  // course cascade → item/enrollment/progress/certificate; asset Restrict theo owner → xoá trước user.
  afterAll(async () => {
    const ids = [alice, stu, carol].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it(
    'xong bài cuối → cấp chứng chỉ; chưa xong hết thì không',
    async () => {
      expect((await learn('post', `/lectures/${a}/complete`).expect(200)).body).toEqual({
        completed: true,
        progressPct: 50,
        certificateSerial: null,
      });
      expect(await certCount()).toBe(0);
      const { body } = await learn('post', `/lectures/${b}/complete`).expect(200);
      expect(body).toMatchObject({ completed: true, progressPct: 100 });
      expect(body.certificateSerial).toMatch(SERIAL_RE);
      serial = body.certificateSerial as string;
      expect(await certCount()).toBe(1);
      expect((await prisma.certificate.findUniqueOrThrow({ where: { serialNo: serial } })).userId).toBe(stu.id);
    },
    SLOW,
  );

  it(
    'bỏ tick rồi tick lại → vẫn một chứng chỉ',
    async () => {
      await learn('delete', `/lectures/${b}/complete`).expect(200);
      expect(await certCount()).toBe(1);
      expect((await learn('post', `/lectures/${b}/complete`).expect(200)).body.certificateSerial).toBeNull();
      expect(await certCount()).toBe(1);
    },
    SLOW,
  );

  it(
    'giảng viên xuất bản thêm bài → chứng chỉ vẫn còn',
    async () => {
      const extra = await prisma.curriculumItem.create({
        data: { sectionId, courseId, title: 'Quiz thêm', type: 'quiz', position: 99, isPublished: true },
        select: { id: true },
      });
      await learn('delete', `/lectures/${a}/complete`).expect(200); // ép tính lại tiến độ
      expect((await prisma.enrollment.findFirstOrThrow({ where: { userId: stu.id, courseId } })).completedAt).toBeNull();
      expect(await certCount()).toBe(1);
      await prisma.curriculumItem.delete({ where: { id: extra.id } });
    },
    SLOW,
  );

  it(
    'GET /me/certificates chỉ trả chứng chỉ của mình',
    async () => {
      const mine = (await call('get', '/api/me/certificates', stu.cookie).expect(200)).body;
      expect(mine).toEqual([
        { serialNo: serial, course: { title: 'Khoá e2e chứng chỉ', slug }, issuedAt: expect.any(String), revoked: false },
      ]);
      expect((await call('get', '/api/me/certificates', carol.cookie).expect(200)).body).toEqual([]);
      await call('get', '/api/me/certificates').expect(401);
    },
    SLOW,
  );

  it(
    'xác thực công khai: thông tin, ảnh, PDF; mã lạ → 404',
    async () => {
      const info = (await call('get', `/api/certificates/${serial}`).expect(200)).body;
      expect(info).toMatchObject({
        serialNo: serial,
        learnerName: 'Nguyễn Thị Minh Anh',
        courseTitle: 'Khoá e2e chứng chỉ',
        courseSlug: slug,
        instructorName: 'Trần Quốc Bảo',
        skills: [],
        revoked: false,
        revokeReason: null,
      });
      const img = await call('get', `/api/certificates/${serial}/image`).expect(200);
      expect(img.headers['content-type']).toBe('image/png');
      expect(img.headers['cache-control']).toBe('public, max-age=300');
      const pdf = await call('get', `/api/certificates/${serial}/pdf`).expect(200);
      expect(pdf.headers['content-type']).toBe('application/pdf');
      expect(pdf.headers['content-disposition']).toBe(`attachment; filename="chung-chi-${serial}.pdf"`);
      for (const bad of ['SP-2222-2222-22', 'khong-phai-ma', 'SP-7K3F-92QX-M0']) {
        expect((await call('get', `/api/certificates/${bad}`).expect(404)).body.code).toBe('CERTIFICATE_NOT_FOUND');
        await call('get', `/api/certificates/${bad}/image`).expect(404);
        await call('get', `/api/certificates/${bad}/pdf`).expect(404);
      }
    },
    SLOW,
  );

  it(
    'đã thu hồi: thông tin vẫn xem được, ảnh và PDF trả 410',
    async () => {
      await prisma.certificate.update({ where: { serialNo: serial }, data: { revokedAt: new Date(), revokeReason: 'Khoá bị gỡ' } });
      expect((await call('get', `/api/certificates/${serial}`).expect(200)).body).toMatchObject({
        revoked: true,
        revokeReason: 'Khoá bị gỡ',
      });
      expect((await call('get', `/api/certificates/${serial}/image`).expect(410)).body.code).toBe('CERTIFICATE_REVOKED');
      expect((await call('get', `/api/certificates/${serial}/pdf`).expect(410)).body.code).toBe('CERTIFICATE_REVOKED');
      expect((await call('get', '/api/me/certificates', stu.cookie).expect(200)).body[0].revoked).toBe(true);
    },
    SLOW,
  );
});
