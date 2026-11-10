import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { MockInstance } from 'vitest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { StorageService } from '../src/infra/storage.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { NotificationsGateway } from '../src/notifications/notifications.gateway.js';
import { setupApp } from '../src/setup-app.js';
import { FakeStorage } from './fake-storage.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const SLOW = 120_000; // DB dev ~1-2s/query

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'delete';
type Tree = { sections: { id: string; items: { id: string; title: string }[] }[] };

describe('Hỏi đáp khoá học (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let push: MockInstance<NotificationsGateway['push']>;
  const emails: string[] = [];
  let alice: TestUser; // giảng viên khoá A
  let bob: TestUser; // giảng viên khoá B
  let stu: TestUser; // học viên A
  let stu2: TestUser; // học viên A
  let carol: TestUser; // chưa ghi danh
  let courseA: string;
  let slug: string;
  let lecId: string; // bài giảng đã xuất bản của A
  let otherLecId: string; // bài giảng của khoá B
  let draftLecId: string; // bài giảng CHƯA xuất bản của A
  let q1: string; // stu hỏi, gắn lecId
  let q2: string; // stu2 hỏi, không gắn bài

  const call = (method: Method, path: string, user?: TestUser, body?: object) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    const withCookie = user ? r.set('Cookie', user.cookie) : r;
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
  const makeLecture = async (owner: TestUser, courseId: string, title = 'Bài 1') => {
    const base = `/api/instructor/courses/${courseId}`;
    const sectionId = ((await call('post', `${base}/sections`, owner, { title: 'Phần 1' }).expect(201)).body as Tree).sections[0].id;
    const tree = (await call('post', `${base}/sections/${sectionId}/items`, owner, { type: 'lecture', title }).expect(201))
      .body as Tree;
    // Tạo section mới có sẵn bài mặc định "Giới thiệu" → chọn đúng bài vừa tạo theo tiêu đề.
    return tree.sections.flatMap((s) => s.items).find((i) => i.title === title)!.id;
  };
  const learn = (method: Method, path: string, user = stu, body?: object) => call(method, `/api/learn/${slug}${path}`, user, body);
  const inst = (method: Method, path: string, user = alice, body?: object) =>
    call(method, `/api/instructor/questions${path}`, user, body);
  const question = (id: string) => prisma.courseQuestion.findUniqueOrThrow({ where: { id } });

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
    push = vi.spyOn(app.get(NotificationsGateway), 'push');
    [alice, bob, stu, stu2, carol] = await Promise.all([makeUser(), makeUser(), makeUser(), makeUser(), makeUser()]);
    courseA = (await call('post', '/api/instructor/courses', alice, { title: 'Khoá e2e hỏi đáp A' }).expect(201)).body.id as string;
    const courseB = (await call('post', '/api/instructor/courses', bob, { title: 'Khoá e2e hỏi đáp B' }).expect(201)).body.id as string;
    [lecId, otherLecId] = await Promise.all([makeLecture(alice, courseA), makeLecture(bob, courseB)]);
    draftLecId = await makeLecture(alice, courseA, 'Bài nháp'); // mặc định chưa xuất bản
    const asset = await prisma.asset.create({
      data: { ownerId: alice.id, kind: 'document', fileName: 'a.pdf', mimeType: 'application/pdf', sizeBytes: BigInt(2048), storageKey: `e2e/${randomUUID()}.pdf`, status: 'ready' },
      select: { id: true },
    });
    // Gắn nội dung thẳng bằng Prisma (bỏ qua upload) — thoả chk_item_payload.
    await prisma.curriculumItem.update({ where: { id: lecId }, data: { lectureKind: 'document', documentAssetId: asset.id, isPublished: true } });
    slug = (await prisma.course.findUniqueOrThrow({ where: { id: courseA }, select: { slug: true } })).slug;
    await prisma.enrollment.createMany({ data: [stu, stu2].map((u) => ({ userId: u.id, courseId: courseA })) });
  }, SLOW);

  // course cascade → section/item/enrollment/question/answer; asset Restrict theo owner; user cascade → notification.
  afterAll(async () => {
    const ids = [alice, bob, stu, stu2, carol].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  type AnswerDto = {
    id: string;
    body: string;
    createdAt: string;
    canDelete: boolean;
    replyTo: { id: string; name: string; answerId: string | null } | null;
  };
  // Trả lời đi kèm danh sách câu hỏi (không còn GET riêng).
  const answersOf = async (questionId: string, user = stu): Promise<AnswerDto[]> =>
    (await learn('get', '/questions', user).expect(200)).body.items.find((q: { id: string }) => q.id === questionId).answers;

  it(
    'quyền + validate: khoá sai 404, chưa ghi danh 403, item khoá khác / chưa xuất bản 404, body sai 400',
    async () => {
      expect((await call('get', '/api/learn/khong-co-khoa-nay/questions', stu).expect(404)).body.code).toBe('COURSE_NOT_FOUND');
      expect((await learn('get', '/questions', carol).expect(403)).body.code).toBe('NOT_ENROLLED');
      expect((await learn('post', '/questions', carol, { body: 'x' }).expect(403)).body.code).toBe('NOT_ENROLLED');
      expect((await learn('post', '/questions', stu, { body: 'x', itemId: otherLecId }).expect(404)).body.code).toBe('ITEM_NOT_FOUND');
      expect((await learn('post', '/questions', stu, { body: 'x', itemId: draftLecId }).expect(404)).body.code).toBe('ITEM_NOT_FOUND');
      await learn('post', '/questions', stu, { body: '   ' }).expect(400);
      await learn('post', '/questions', stu, { body: 'a'.repeat(2001) }).expect(400);
      await learn('post', '/questions', stu, { body: 'ok', title: 'thừa' }).expect(400); // .strict(): bỏ trường title cũ
      await learn('post', '/questions', stu, { body: 'ok', itemId: 'abc' }).expect(400);
    },
    SLOW,
  );

  it(
    'hỏi + liệt kê theo bài / cả khoá, mới nhất trước, kèm trả lời + total, cursor 20/trang',
    async () => {
      const { body: a } = await learn('post', '/questions', stu, { body: '  Vì sao\n\nlỗi?  ', itemId: lecId }).expect(201);
      expect(a).toMatchObject({
        body: 'Vì sao\n\nlỗi?',
        item: { id: lecId, title: 'Bài 1' },
        course: { id: courseA, slug },
        author: { id: stu.id, name: 'E2E', image: null },
        answerCount: 0,
        instructorAnswered: false,
        canDelete: true,
        answers: [],
      });
      q1 = a.id;
      q2 = (await learn('post', '/questions', stu2, { body: '```js\n1\n```' }).expect(201)).body.id;
      // Giảng viên được báo khi có câu hỏi mới; câu không gắn bài dẫn về trang khoá.
      const asked = await prisma.notification.findMany({ where: { userId: alice.id }, orderBy: { createdAt: 'asc' } });
      expect(asked).toMatchObject([
        {
          type: 'qa_question',
          title: 'E2E đã đặt câu hỏi trong Khoá e2e hỏi đáp A',
          body: 'Vì sao lỗi?',
          link: `/learn/${slug}/lecture/${lecId}?tab=qa&question=${q1}`,
          data: { questionId: q1 },
        },
        { type: 'qa_question', link: `/learn/${slug}`, data: { questionId: q2 } },
      ]);

      const byLecture = (await learn('get', `/questions?itemId=${lecId}`).expect(200)).body;
      expect(byLecture.items.map((q: { id: string }) => q.id)).toEqual([q1]);
      expect(byLecture.total).toBe(1);
      const all = (await learn('get', '/questions').expect(200)).body;
      expect(all.items.map((q: { id: string }) => q.id)).toEqual([q2, q1]);
      expect(all.items[0]).toMatchObject({ canDelete: false, item: null, body: '```js\n1\n```' });
      expect(all).toMatchObject({ total: 2, nextCursor: null });

      await prisma.courseQuestion.createMany({
        data: Array.from({ length: 20 }, (_, i) => ({ courseId: courseA, userId: stu2.id, body: `Đệm ${i}` })),
      });
      const p1 = (await learn('get', '/questions').expect(200)).body;
      expect(p1.items).toHaveLength(20);
      expect(p1.total).toBe(22);
      expect(p1.nextCursor).toBe(p1.items[19].id);
      const p2 = (await learn('get', `/questions?cursor=${p1.nextCursor}`).expect(200)).body;
      expect(p2.nextCursor).toBeNull();
      const ids = [...p1.items, ...p2.items].map((q: { id: string }) => q.id);
      expect(new Set(ids).size).toBe(22);
      await prisma.courseQuestion.deleteMany({ where: { courseId: courseA, body: { startsWith: 'Đệm ' } } });
    },
    SLOW,
  );

  it(
    'trả lời: answerCount, isInstructor, instructorAnsweredAt, replyTo, notification qa_answer (không tự báo mình)',
    async () => {
      const { body: a1 } = await learn('post', `/questions/${q1}/answers`, stu2, { body: '  Thử xoá cache  ' }).expect(201);
      expect(a1).toMatchObject({ body: 'Thử xoá cache', isInstructor: false, canDelete: true, author: { id: stu2.id }, replyTo: null });
      expect(await question(q1)).toMatchObject({ answerCount: 1, instructorAnsweredAt: null });
      const notes = await prisma.notification.findMany({ where: { userId: stu.id } });
      expect(notes).toHaveLength(1);
      expect(notes[0]).toMatchObject({
        type: 'qa_answer',
        title: 'Có câu trả lời mới',
        body: 'Câu hỏi "Vì sao lỗi?"', // xuống dòng gom thành 1 dấu cách
        link: `/learn/${slug}/lecture/${lecId}?tab=qa&question=${q1}&answer=${a1.id}`,
        data: { questionId: q1, answerId: a1.id },
      });

      // Trả lời một câu trả lời → replyTo là người viết câu đó; tự trả lời câu của mình không báo.
      const { body: r1 } = await learn('post', `/questions/${q1}/answers`, stu, { body: 'Cảm ơn', replyToAnswerId: a1.id }).expect(201);
      expect(r1.replyTo).toEqual({ id: stu2.id, name: 'E2E', answerId: a1.id });
      // Người được trả lời (stu2) nhận thông báo riêng, nội dung là câu trả lời mới.
      expect(await prisma.notification.findMany({ where: { userId: stu2.id } })).toMatchObject([
        {
          type: 'qa_answer',
          title: 'E2E đã trả lời bình luận của bạn',
          body: 'Cảm ơn',
          link: `/learn/${slug}/lecture/${lecId}?tab=qa&question=${q1}&answer=${r1.id}`,
          data: { questionId: q1, answerId: r1.id },
        },
      ]);
      expect(await prisma.notification.count({ where: { userId: stu.id } })).toBe(1);
      const otherQ = (await learn('post', '/questions', stu2, { body: 'câu khác' }).expect(201)).body.id;
      expect(
        (await learn('post', `/questions/${otherQ}/answers`, stu, { body: 'x', replyToAnswerId: a1.id }).expect(404)).body.code,
      ).toBe('ANSWER_NOT_FOUND');
      await learn('delete', `/questions/${otherQ}`, stu2).expect(204);
      await learn('post', `/questions/${q1}/answers`, stu, { body: 'x', replyToAnswerId: 'abc' }).expect(400);

      const { body: i1 } = await inst('post', `/${q1}/answers`, alice, { body: 'Giảng viên trả lời' }).expect(201);
      expect(i1).toMatchObject({ isInstructor: true, canDelete: true });
      const after = await question(q1);
      expect(after.answerCount).toBe(3);
      expect(after.instructorAnsweredAt?.toISOString()).toBe(i1.createdAt);
      const { body: i2 } = await inst('post', `/${q1}/answers`, alice, { body: 'Bổ sung', replyToAnswerId: a1.id }).expect(201);
      expect(i2.replyTo).toEqual({ id: stu2.id, name: 'E2E', answerId: a1.id });
      // 3 người: người hỏi (stu) và người được @ (stu2) mỗi người 1 thông báo, nội dung khác nhau.
      const lastOf = (userId: string) => prisma.notification.findFirstOrThrow({ where: { userId }, orderBy: { createdAt: 'desc' } });
      expect(await lastOf(stu.id)).toMatchObject({ title: 'Có câu trả lời mới', data: { questionId: q1, answerId: i2.id } });
      expect(await lastOf(stu2.id)).toMatchObject({ title: 'E2E đã trả lời bình luận của bạn', body: 'Bổ sung', data: { answerId: i2.id } });
      expect((await question(q1)).instructorAnsweredAt?.toISOString()).toBe(i1.createdAt);

      const list = await answersOf(q1, stu2);
      expect(list.map((x) => x.body)).toEqual(['Thử xoá cache', 'Cảm ơn', 'Giảng viên trả lời', 'Bổ sung']);
      expect(list.map((x) => x.canDelete)).toEqual([true, false, false, false]);
      expect((await learn('get', '/questions').expect(200)).body.items.find((q: { id: string }) => q.id === q1))
        .toMatchObject({ answerCount: 4, instructorAnswered: true });
      await learn('post', `/questions/${q1}/answers`, stu, { body: ' ' }).expect(400);
      await learn('post', `/questions/${q1}/answers`, stu, { body: 'a'.repeat(2001) }).expect(400);
      expect((await learn('post', `/questions/${randomUUID()}/answers`, stu, { body: 'x' }).expect(404)).body.code).toBe('QUESTION_NOT_FOUND');
    },
    SLOW,
  );

  it(
    'trả lời qua lại: gộp 1 thông báo khi người được @ là người hỏi; xoá bình luận đích → answerId null; GET 1 câu hỏi',
    async () => {
      const q3 = (await learn('post', '/questions', stu, { body: 'Câu q3', itemId: lecId }).expect(201)).body.id as string;
      const b1 = (await learn('post', `/questions/${q3}/answers`, stu2, { body: 'Gợi ý' }).expect(201)).body;
      const b2 = (await learn('post', `/questions/${q3}/answers`, stu, { body: 'Chưa được', replyToAnswerId: b1.id }).expect(201)).body;
      const before = await prisma.notification.count({ where: { userId: stu.id } });
      // stu2 trả lời bình luận của stu trong câu hỏi của stu → stu chỉ nhận 1 thông báo, loại "trả lời bình luận".
      const b3 = (await learn('post', `/questions/${q3}/answers`, stu2, { body: 'Thử lại xem', replyToAnswerId: b2.id }).expect(201))
        .body;
      const fresh = await prisma.notification.findMany({ where: { userId: stu.id }, orderBy: { createdAt: 'desc' }, take: 2 });
      expect(await prisma.notification.count({ where: { userId: stu.id } })).toBe(before + 1);
      expect(fresh[0]).toMatchObject({ title: 'E2E đã trả lời bình luận của bạn', data: { questionId: q3, answerId: b3.id } });

      // GET 1 câu hỏi: học viên + chủ khoá được; id lạ 404; chưa ghi danh 403.
      const one = (await learn('get', `/questions/${q3}`).expect(200)).body;
      expect(one).toMatchObject({ id: q3, answerCount: 3 });
      expect(one.answers.map((x: AnswerDto) => x.replyTo?.answerId ?? null)).toEqual([null, b1.id, b2.id]);
      await learn('get', `/questions/${q3}`, alice).expect(200);
      expect((await learn('get', `/questions/${randomUUID()}`).expect(404)).body.code).toBe('QUESTION_NOT_FOUND');
      expect((await learn('get', '/questions/abc').expect(404)).body.code).toBe('QUESTION_NOT_FOUND');
      expect((await learn('get', `/questions/${q3}`, carol).expect(403)).body.code).toBe('NOT_ENROLLED');

      // Xoá bình luận đích → trả lời trỏ tới nó còn tên, mất answerId.
      await learn('delete', `/answers/${b1.id}`, stu2).expect(204);
      const after = (await learn('get', `/questions/${q3}`).expect(200)).body.answers as AnswerDto[];
      expect(after.find((x) => x.id === b2.id)?.replyTo).toEqual({ id: stu2.id, name: 'E2E', answerId: null });
      await learn('delete', `/questions/${q3}`, stu).expect(204);
    },
    SLOW,
  );

  it(
    'giảng viên: chỉ khoá mình, lọc chưa trả lời / theo khoá; khoá người khác 404',
    async () => {
      const unanswered = (await inst('get', '?unanswered=1').expect(200)).body;
      expect(unanswered.items.map((q: { id: string }) => q.id)).toEqual([q2]);
      expect(unanswered.total).toBe(1);
      const mine = (await inst('get', `?courseId=${courseA}`).expect(200)).body.items;
      expect(mine.map((q: { id: string }) => q.id)).toEqual([q2, q1]);
      expect(mine[0]).toMatchObject({ canDelete: true, course: { id: courseA, title: 'Khoá e2e hỏi đáp A', slug } });
      expect(mine[1].answers.map((x: AnswerDto) => x.canDelete)).toEqual([true, true, true, true]);
      expect((await inst('get', '', bob).expect(200)).body).toMatchObject({ items: [], total: 0 });
      expect((await inst('post', `/${q1}/answers`, bob, { body: 'x' }).expect(404)).body.code).toBe('QUESTION_NOT_FOUND');
      expect((await inst('delete', `/${q1}`, bob).expect(404)).body.code).toBe('QUESTION_NOT_FOUND');
    },
    SLOW,
  );

  it(
    'xoá: chỉ tác giả hoặc giảng viên; tính lại answerCount + instructorAnsweredAt; xoá câu hỏi cascade',
    async () => {
      const [byStu2, byStu, inst1, inst2] = await answersOf(q1);
      expect((await learn('delete', `/questions/${q1}`, stu2).expect(404)).body.code).toBe('QUESTION_NOT_FOUND');
      expect((await learn('delete', `/answers/${inst1.id}`, stu).expect(404)).body.code).toBe('ANSWER_NOT_FOUND');
      expect((await inst('delete', `/answers/${byStu.id}`, bob).expect(404)).body.code).toBe('ANSWER_NOT_FOUND');
      expect((await learn('delete', '/answers/abc').expect(404)).body.code).toBe('ANSWER_NOT_FOUND');

      await inst('delete', `/answers/${inst1.id}`).expect(204);
      expect(await question(q1)).toMatchObject({ answerCount: 3, instructorAnsweredAt: new Date(inst2.createdAt) });
      await inst('delete', `/answers/${inst2.id}`).expect(204);
      expect(await question(q1)).toMatchObject({ answerCount: 2, instructorAnsweredAt: null });
      await learn('delete', `/answers/${byStu.id}`, stu).expect(204);
      await inst('delete', `/answers/${byStu2.id}`).expect(204); // giảng viên xoá bài học viên
      expect((await question(q1)).answerCount).toBe(0);

      await learn('post', `/questions/${q1}/answers`, stu2, { body: 'còn lại' }).expect(201);
      await learn('delete', `/questions/${q1}`, stu).expect(204);
      expect(await prisma.courseAnswer.count({ where: { questionId: q1 } })).toBe(0);
      await inst('delete', `/${q2}`).expect(204);
      expect((await learn('get', '/questions').expect(200)).body).toMatchObject({ items: [], total: 0 });
    },
    SLOW,
  );

  it(
    'mỗi notification qa_answer ghi xuống DB được đẩy socket đúng 1 lần',
    async () => {
      const users = [alice, bob, stu, stu2, carol].map((u) => u.id);
      const rows = (await prisma.notification.findMany({ where: { userId: { in: users } }, select: { id: true } })).map((n) => n.id);
      expect(rows.length).toBeGreaterThan(0);
      expect(push.mock.calls.map(([n]) => n.id).sort()).toEqual(rows.sort());
    },
    SLOW,
  );
});
