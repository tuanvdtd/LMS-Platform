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
const TAG = randomUUID().slice(0, 8);

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'put' | 'delete';

describe('Blog: thả tim + bình luận (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let push: MockInstance<NotificationsGateway['push']>;
  const emails: string[] = [];
  let author: TestUser;
  let reader: TestUser;
  let other: TestUser;
  let admin: TestUser;
  let spammer: TestUser;
  let postId: string;
  const slug = `e2e-engage-${TAG}`;
  const draftSlug = `e2e-engage-draft-${TAG}`;

  const call = (method: Method, path: string, cookie?: string, body?: object) => {
    const r = request(app.getHttpServer())[method](`/api${path}`).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    const withCookie = cookie ? r.set('Cookie', cookie) : r;
    return body ? withCookie.send(body) : withCookie;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (name: string, role = 'student'): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/auth/sign-up/email', undefined, { name, email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role } });
    const res = await call('post', '/auth/sign-in/email', undefined, { email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };
  const counts = () => prisma.post.findUniqueOrThrow({ where: { id: postId }, select: { likeCount: true, commentCount: true } });
  const comment = (u: TestUser, body: string, replyToCommentId?: string) =>
    call('post', `/posts/${slug}/comments`, u.cookie, { body, ...(replyToCommentId && { replyToCommentId }) });
  const noticesOf = (userId: string) =>
    prisma.notification.findMany({ where: { userId, type: 'post_comment' }, orderBy: { createdAt: 'asc' } });

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
    [author, reader, other, admin, spammer] = await Promise.all([
      makeUser('Tác Giả', 'student,instructor'),
      makeUser('Người Đọc'),
      makeUser('Người Khác'),
      makeUser('Quản Trị', 'admin'),
      makeUser('Spam'),
    ]);
    // Tạo thẳng trong DB: luồng xuất bản đã có e2e riêng (posts.e2e-spec.ts).
    postId = (
      await prisma.post.create({
        data: { authorId: author.id, slug, title: `Bài e2e ${TAG}`, status: 'published', publishedAt: new Date() },
        select: { id: true },
      })
    ).id;
    await prisma.post.create({ data: { authorId: author.id, slug: draftSlug, title: 'Nháp', status: 'draft' } });
  }, SLOW);

  // posts cascade → likes, comments; user cascade → notifications.
  afterAll(async () => {
    const ids = [author, reader, other, admin, spammer].filter(Boolean).map((u) => u.id);
    await prisma?.post.deleteMany({ where: { authorId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it(
    'tim: idempotent, bỏ tim, khách 401, bài nháp 404',
    async () => {
      await call('put', `/posts/${slug}/like`).expect(401);
      expect((await call('put', `/posts/${slug}/like`, reader.cookie).expect(200)).body).toEqual({ liked: true, likeCount: 1 });
      expect((await call('put', `/posts/${slug}/like`, reader.cookie).expect(200)).body).toEqual({ liked: true, likeCount: 1 });
      expect((await call('get', `/posts/${slug}/like`, reader.cookie).expect(200)).body).toEqual({ liked: true, likeCount: 1 });
      expect((await call('get', `/posts/${slug}/like`, other.cookie).expect(200)).body).toEqual({ liked: false, likeCount: 1 });
      expect((await call('delete', `/posts/${slug}/like`, reader.cookie).expect(200)).body).toEqual({ liked: false, likeCount: 0 });
      expect((await call('delete', `/posts/${slug}/like`, reader.cookie).expect(200)).body).toEqual({ liked: false, likeCount: 0 });
      expect((await counts()).likeCount).toBe(0);
      expect((await call('put', `/posts/${draftSlug}/like`, reader.cookie).expect(404)).body.code).toBe('POST_NOT_FOUND');
      await call('put', `/posts/${slug}/like`, admin.cookie).expect(200); // staff được tim
      expect((await call('get', `/posts/${slug}`).expect(200)).body.likeCount).toBe(1);
    },
    SLOW,
  );

  let root: string;
  let reply1: string;
  let reply2: string;

  it(
    'bình luận + trả lời: 1 cấp, "@Tên" chỉ khi trả lời một trả lời, số đếm, thông báo',
    async () => {
      await call('post', `/posts/${slug}/comments`, undefined, { body: 'x' }).expect(401);
      await comment(reader, '   ').expect(400);
      push.mockClear();

      root = (await comment(reader, 'Bài hay **quá**').expect(201)).body.id as string;
      // Trả lời thẳng vào gốc: không "@", gốc là root.
      const r1 = (await comment(other, 'Đồng ý', root).expect(201)).body;
      reply1 = r1.id as string;
      expect(r1.parentId).toBe(root);
      expect(r1.replyTo).toBeNull();
      // Trả lời một trả lời: vẫn gắn về root, có "@Người Khác".
      const r2 = (await comment(author, 'Cảm ơn', reply1).expect(201)).body;
      reply2 = r2.id as string;
      expect(r2.parentId).toBe(root);
      expect(r2.replyTo).toEqual({ id: other.id, name: 'Người Khác', commentId: reply1 });

      expect(await counts()).toMatchObject({ commentCount: 3 });
      const rootRow = await prisma.postComment.findUniqueOrThrow({ where: { id: root }, select: { replyCount: true } });
      expect(rootRow.replyCount).toBe(2);

      // reader bình luận → author; other trả lời reader → reader ("trả lời") + author; author trả lời other → other.
      const toAuthor = await noticesOf(author.id);
      expect(toAuthor.map((n) => n.title)).toEqual([
        `Người Đọc đã bình luận bài "Bài e2e ${TAG}"`,
        `Người Khác đã bình luận bài "Bài e2e ${TAG}"`,
      ]);
      expect(toAuthor[0].link).toBe(`/blog/${slug}?comment=${root}`);
      const toReader = await noticesOf(reader.id);
      expect(toReader.map((n) => n.title)).toEqual([`Người Khác đã trả lời bình luận của bạn trong "Bài e2e ${TAG}"`]);
      expect(toReader[0].link).toBe(`/blog/${slug}?comment=${root}&reply=${reply1}`);
      const toOther = await noticesOf(other.id);
      expect(toOther).toHaveLength(1);
      // Mỗi thông báo trong DB được đẩy đúng 1 lần.
      const all = [...toAuthor, ...toReader, ...toOther].map((n) => n.id).sort();
      expect(push.mock.calls.map(([n]) => n.id).sort()).toEqual(all);

      await comment(reader, 'x', randomUUID()).expect(404);
    },
    SLOW,
  );

  it(
    'danh sách công khai: mới nhất trước, trả lời cũ → mới, con trỏ, một luồng theo id trả lời',
    async () => {
      const second = (await comment(other, 'Bình luận thứ hai').expect(201)).body.id as string;
      const page = (await call('get', `/posts/${slug}/comments`).expect(200)).body;
      expect(page.commentCount).toBe(4);
      expect(page.items.map((t: { id: string }) => t.id)).toEqual([second, root]);
      expect(page.items[1].replies.map((r: { id: string }) => r.id)).toEqual([reply1, reply2]);
      expect(page.items[1].replyCount).toBe(2);
      expect(page.nextCursor).toBeNull();
      const after = (await call('get', `/posts/${slug}/comments?cursor=${second}`).expect(200)).body;
      expect(after.items.map((t: { id: string }) => t.id)).toEqual([root]);
      const thread = (await call('get', `/posts/${slug}/comments/${reply2}`).expect(200)).body;
      expect(thread.id).toBe(root);
      await call('get', `/posts/${slug}/comments/${randomUUID()}`).expect(404);
      await call('get', `/posts/${draftSlug}/comments`).expect(404);
    },
    SLOW,
  );

  it(
    'admin bình luận hiện tên Aolumi, không lộ id',
    async () => {
      const c = (await comment(admin, 'Ghi chú từ đội ngũ').expect(201)).body;
      expect(c.author).toEqual({ id: null, name: 'Aolumi', image: null });
      await call('delete', `/post-comments/${c.id}`, admin.cookie).expect(204);
    },
    SLOW,
  );

  it(
    'xoá: người lạ 404; người viết xoá trả lời; tác giả bài xoá gốc kéo theo trả lời; số đếm đúng',
    async () => {
      const before = (await counts()).commentCount; // 4: root + 2 trả lời + "thứ hai"
      expect((await call('delete', `/post-comments/${reply1}`, spammer.cookie).expect(404)).body.code).toBe('COMMENT_NOT_FOUND');
      await call('delete', `/post-comments/${reply1}`, other.cookie).expect(204);
      expect((await counts()).commentCount).toBe(before - 1);
      // reply2 từng "@" reply1 → commentId thành null.
      const t = (await call('get', `/posts/${slug}/comments/${root}`).expect(200)).body;
      expect(t.replies[0].replyTo).toEqual({ id: other.id, name: 'Người Khác', commentId: null });
      expect(t.replyCount).toBe(1);
      await call('delete', `/post-comments/${root}`, author.cookie).expect(204);
      expect((await counts()).commentCount).toBe(before - 3);
      expect(await prisma.postComment.count({ where: { id: { in: [root, reply2] } } })).toBe(0);
      await call('delete', `/post-comments/${root}`, author.cookie).expect(404);
      // Admin xoá bình luận của người khác.
      const second = (await call('get', `/posts/${slug}/comments`).expect(200)).body.items[0].id as string;
      await call('delete', `/post-comments/${second}`, admin.cookie).expect(204);
      expect((await counts()).commentCount).toBe(before - 4);
    },
    SLOW,
  );

  it(
    'bài bị gỡ: đọc / tim / bình luận đều 404, dữ liệu còn nguyên',
    async () => {
      const keep = (await comment(reader, 'Trước khi gỡ').expect(201)).body.id as string;
      await prisma.post.update({ where: { id: postId }, data: { status: 'removed' } });
      try {
        await call('get', `/posts/${slug}/comments`).expect(404);
        await call('put', `/posts/${slug}/like`, reader.cookie).expect(404);
        await comment(reader, 'x').expect(404);
        await call('delete', `/post-comments/${keep}`, reader.cookie).expect(404);
        expect(await prisma.postComment.count({ where: { id: keep } })).toBe(1);
      } finally {
        await prisma.post.update({ where: { id: postId }, data: { status: 'published' } });
      }
    },
    SLOW,
  );

  it(
    'giới hạn 10 bình luận / phút',
    async () => {
      for (let i = 0; i < 10; i++) await comment(spammer, `spam ${i}`).expect(201);
      await comment(spammer, 'spam 11').expect(429);
    },
    SLOW,
  );
});
