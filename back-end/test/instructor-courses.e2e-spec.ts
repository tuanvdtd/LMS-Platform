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
// Rate limit của Better Auth nằm ở Redis, sống qua các lần chạy → mỗi request một IP (xem auth.e2e-spec).
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;

type TestUser = { id: string; cookie: string };

describe('Instructor courses (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let alice: TestUser; // học viên, tự bật vai trò qua become-instructor
  let bob: TestUser; // giảng viên khác
  let student: TestUser;

  const call = (method: 'get' | 'post' | 'patch', path: string, cookie?: string) => {
    const r = request(app.getHttpServer())
      [method](path)
      .set('Origin', FE_URL)
      .set('X-Forwarded-For', randomIp());
    return cookie ? r.set('Cookie', cookie) : r;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  // Đăng ký → đánh dấu đã xác minh (+ role) thẳng DB trước khi có session → đăng nhập.
  const makeUser = async (role = 'student'): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email').send({ name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role } });
    const res = await call('post', '/api/auth/sign-in/email').send({ email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    [alice, bob, student] = await Promise.all([makeUser(), makeUser('student,instructor'), makeUser()]);
  });

  // Dọn: course trước (FK instructor Restrict; section/item/course_topics cascade), user sau.
  afterAll(async () => {
    const ids = [alice, bob, student].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  describe('POST /api/me/become-instructor', () => {
    it('chưa đăng nhập → 401', () => call('post', '/api/me/become-instructor').expect(401));

    it('gọi 2 lần → role chứa instructor đúng một lần; /api/me thấy ngay (cache Redis được làm mới)', async () => {
      await call('post', '/api/me/become-instructor', alice.cookie).expect(200);
      const res = await call('post', '/api/me/become-instructor', alice.cookie).expect(200);
      expect(res.body.role).toBe('student,instructor');
      const me = await call('get', '/api/me', alice.cookie).expect(200);
      expect(me.body.role).toBe('student,instructor');
      const db = await prisma.user.findUniqueOrThrow({ where: { id: alice.id } });
      expect(db.role).toBe('student,instructor');
    });

    it('ngay sau đó, cùng cookie → GET /api/instructor/courses 200 (guard thấy role mới)', () =>
      call('get', '/api/instructor/courses', alice.cookie).expect(200));
  });

  describe('/api/instructor/courses', () => {
    let courseId: string;
    const url = () => `/api/instructor/courses/${courseId}`;
    const primaryRows = () =>
      prisma.courseTopic.findMany({ where: { courseId, isPrimary: true }, select: { topicId: true } });
    type Err = { path: string[]; message: string };

    it('học viên → 403', () => call('get', '/api/instructor/courses', student.cookie).expect(403));

    it('tạo khoá → 201 {id}; DB có section + lecture mặc định, slug từ tiêu đề', async () => {
      const res = await call('post', '/api/instructor/courses', alice.cookie)
        .send({ title: '  Lập trình React cơ bản ' })
        .expect(201);
      expect(Object.keys(res.body)).toEqual(['id']);
      courseId = res.body.id;
      const course = await prisma.course.findUniqueOrThrow({
        where: { id: courseId },
        include: { sections: { include: { items: true } } },
      });
      expect(course).toMatchObject({
        title: 'Lập trình React cơ bản',
        status: 'draft',
        instructorId: alice.id,
        categoryId: null,
        track: null,
        level: null,
      });
      expect(course.slug).toMatch(/^lap-trinh-react-co-ban-[a-z0-9]{6}$/);
      expect(course.sections).toHaveLength(1);
      expect(course.sections[0]).toMatchObject({ title: 'Giới thiệu', position: 1 });
      expect(course.sections[0].items).toHaveLength(1);
      expect(course.sections[0].items[0]).toMatchObject({
        courseId,
        type: 'lecture',
        title: 'Giới thiệu',
        position: 1,
        isPublished: false,
        lectureKind: null,
      });
    });

    it('tên chỉ có khoảng trắng / quá 60 ký tự → 400 path title', async () => {
      const res = await call('post', '/api/instructor/courses', alice.cookie).send({ title: '   ' }).expect(400);
      expect(res.body).toMatchObject({ statusCode: 400, message: 'Dữ liệu không hợp lệ' });
      expect((res.body.errors as Err[]).map((e) => e.path)).toEqual([['title']]);
      await call('post', '/api/instructor/courses', alice.cookie).send({ title: 'x'.repeat(61) }).expect(400);
    });

    it('danh sách chỉ có khoá của mình, kèm progress', async () => {
      const other = await call('post', '/api/instructor/courses', bob.cookie).send({ title: 'Khoá của Bob' }).expect(201);
      const { body } = await call('get', '/api/instructor/courses', alice.cookie).expect(200);
      const list = body as { id: string }[];
      expect(list.map((c) => c.id)).toContain(courseId);
      expect(list.map((c) => c.id)).not.toContain(other.body.id);
      expect(list.find((c) => c.id === courseId)).toEqual({
        id: courseId,
        title: 'Lập trình React cơ bản',
        status: 'draft',
        thumbnailUrl: null,
        updatedAt: expect.any(String),
        progress: { done: 0, total: 3 },
      });
    });

    it('GET chi tiết: đúng shape CourseDetail, checklist 3 mục', async () => {
      const { body } = await call('get', url(), alice.cookie).expect(200);
      expect(Object.keys(body).sort()).toEqual(
        [
          'id', 'slug', 'status', 'title', 'subtitle', 'description', 'language', 'level', 'track',
          'thumbnailUrl', 'promoVideoUrl', 'learningObjectives', 'requirements', 'targetAudience',
          'category', 'primaryTopic', 'updatedAt', 'checklist',
        ].sort(),
      );
      expect(body).toMatchObject({ id: courseId, language: 'vi', category: null, primaryTopic: null, learningObjectives: [] });
      expect(body.checklist.map((i: { key: string }) => i.key)).toEqual(['goals', 'curriculum', 'basics']);
      expect(body.checklist[2].missing.map((m: { anchor: string }) => m.anchor)).toEqual([
        'subtitle', 'description', 'level', 'track', 'category', 'topic', 'thumbnail',
      ]);
    });

    it('PATCH hợp lệ → CourseDetail với checklist mới; bỏ phần tử rỗng; trim', async () => {
      const { body } = await call('patch', url(), alice.cookie)
        .send({
          learningObjectives: ['Hiểu JSX', 'Viết component', '   ', 'Dùng hooks', 'Gọi API'],
          requirements: ['Biết JavaScript'],
          targetAudience: ['Người mới học React'],
          subtitle: '  Từ số 0  ',
          level: 'beginner',
          track: 'frontend',
        })
        .expect(200);
      expect(body.learningObjectives).toEqual(['Hiểu JSX', 'Viết component', 'Dùng hooks', 'Gọi API']);
      expect(body.subtitle).toBe('Từ số 0');
      expect(body.checklist[0]).toEqual({ key: 'goals', done: true, missing: [] });
      expect(body.checklist[2].missing.map((m: { anchor: string }) => m.anchor)).toEqual([
        'description', 'category', 'topic', 'thumbnail',
      ]);
      const again = await call('patch', url(), alice.cookie).send({ subtitle: '' }).expect(200);
      expect(again.body.subtitle).toBeNull();
    });

    it('PATCH sai → 400 có path cho từng trường; trường lạ bị chặn (strict)', async () => {
      const res = await call('patch', url(), alice.cookie)
        .send({ title: '', level: 'expert', learningObjectives: ['x'.repeat(161)], language: 'fr' })
        .expect(400);
      const paths = (res.body.errors as Err[]).map((e) => e.path.join('.'));
      expect(paths).toEqual(expect.arrayContaining(['title', 'level', 'learningObjectives.0', 'language']));
      await call('patch', url(), alice.cookie).send({ welcomeMessage: 'hi' }).expect(400);
    });

    it('category cấp 1 / không tồn tại → 400 path categoryId; cấp 2 → OK, trả kèm parent', async () => {
      const root = await prisma.category.findFirstOrThrow({ where: { parentId: null, children: { some: {} } } });
      const leaf = await prisma.category.findFirstOrThrow({ where: { parentId: root.id } });
      const bad = await call('patch', url(), alice.cookie).send({ categoryId: root.id }).expect(400);
      expect(bad.body.errors).toEqual([{ path: ['categoryId'], message: expect.any(String) }]);
      await call('patch', url(), alice.cookie).send({ categoryId: randomUUID() }).expect(400);
      const ok = await call('patch', url(), alice.cookie).send({ categoryId: leaf.id }).expect(200);
      expect(ok.body.category).toEqual({
        id: leaf.id,
        slug: leaf.slug,
        name: leaf.name,
        parent: { id: root.id, slug: root.slug, name: root.name },
      });
      const cleared = await call('patch', url(), alice.cookie).send({ categoryId: null }).expect(200);
      expect(cleared.body.category).toBeNull();
    }, 60_000);

    it('đổi topic chính → luôn đúng 1 dòng isPrimary; topic đã gắn dạng không chính được nâng lên', async () => {
      const [t1, t2, t3] = await prisma.topic.findMany({ take: 3, orderBy: { slug: 'asc' } });
      await prisma.courseTopic.create({ data: { courseId, topicId: t3.id } }); // gắn sẵn, không chính

      await call('patch', url(), alice.cookie).send({ primaryTopicId: t1.id }).expect(200);
      const res = await call('patch', url(), alice.cookie).send({ primaryTopicId: t2.id }).expect(200);
      expect(res.body.primaryTopic).toEqual({ id: t2.id, slug: t2.slug, name: t2.name });
      expect(await primaryRows()).toEqual([{ topicId: t2.id }]);
      expect(await prisma.courseTopic.count({ where: { courseId, topicId: t3.id, isPrimary: false } })).toBe(1);

      await call('patch', url(), alice.cookie).send({ primaryTopicId: t3.id }).expect(200);
      expect(await primaryRows()).toEqual([{ topicId: t3.id }]);

      const bad = await call('patch', url(), alice.cookie).send({ primaryTopicId: randomUUID() }).expect(400);
      expect(bad.body.errors).toEqual([{ path: ['primaryTopicId'], message: expect.any(String) }]);

      const cleared = await call('patch', url(), alice.cookie).send({ primaryTopicId: null }).expect(200);
      expect(cleared.body.primaryTopic).toBeNull();
      expect(await primaryRows()).toEqual([]);
    }, 60_000);

    it('giảng viên khác / id không tồn tại / id sai định dạng → 404', async () => {
      await call('get', url(), bob.cookie).expect(404);
      await call('patch', url(), bob.cookie).send({ title: 'Cướp khoá' }).expect(404);
      await call('get', `/api/instructor/courses/${randomUUID()}`, alice.cookie).expect(404);
      await call('get', '/api/instructor/courses/abc', alice.cookie).expect(404);
    });

    it('khoá in_review → PATCH 409 COURSE_LOCKED; GET vẫn đọc được', async () => {
      await prisma.course.update({ where: { id: courseId }, data: { status: 'in_review' } });
      const res = await call('patch', url(), alice.cookie).send({ title: 'Mới' }).expect(409);
      expect(res.body).toMatchObject({ statusCode: 409, code: 'COURSE_LOCKED' });
      await call('get', url(), alice.cookie).expect(200);
      await prisma.course.update({ where: { id: courseId }, data: { status: 'draft' } });
    });
  });
});
