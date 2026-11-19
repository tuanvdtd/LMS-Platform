import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { AssetsCleanupService } from '../src/assets/assets-cleanup.service.js';
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
const TAG = randomUUID().slice(0, 8); // tiêu đề riêng cho lượt chạy này → slug không đụng lượt trước

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'patch' | 'delete';

describe('Blog (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const storage = new FakeStorage();
  const emails: string[] = [];
  let author: TestUser; // có khoá published → được viết
  let other: TestUser; // có khoá published → được viết, dùng để thử sửa bài người khác
  let plain: TestUser; // tự bật role instructor, chưa có khoá → không được viết
  let admin: TestUser;
  let topicId: string;
  let topicSlug: string;
  let authorCourse: string;
  let otherCourse: string;
  let postId: string;
  let slug: string;

  const call = (method: Method, path: string, cookie?: string, body?: object) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    const withCookie = cookie ? r.set('Cookie', cookie) : r;
    return body ? withCookie.send(body) : withCookie;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (name: string, role = 'student,instructor'): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email', undefined, { name, email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role } });
    const res = await call('post', '/api/auth/sign-in/email', undefined, { email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };
  const publishedCourse = async (u: TestUser, title: string) => {
    const id = (await call('post', '/api/instructor/courses', u.cookie, { title }).expect(201)).body.id as string;
    await prisma.course.update({ where: { id }, data: { status: 'published' } });
    return id;
  };
  const me = (method: Method, path: string, user: TestUser, body?: object) =>
    call(method, `/api/me/posts${path}`, user.cookie, body);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .overrideProvider(StorageService)
      .useValue(storage)
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    [author, other, plain, admin] = await Promise.all([
      makeUser('Tác Giả'),
      makeUser('Người Khác'),
      makeUser('Chưa Có Khoá'),
      makeUser('Quản Trị', 'admin'),
    ]);
    [authorCourse, otherCourse] = await Promise.all([
      publishedCourse(author, 'Khoá e2e blog A'),
      publishedCourse(other, 'Khoá e2e blog B'),
    ]);
    const topic = await prisma.topic.create({ data: { slug: `e2e-blog-${TAG}`, name: `Chủ đề e2e ${TAG}` } });
    topicId = topic.id;
    topicSlug = topic.slug;
  }, SLOW);

  // posts cascade theo user và topic; course không cascade theo instructor → xoá trước user.
  afterAll(async () => {
    const ids = [author, other, plain, admin].filter(Boolean).map((u) => u.id);
    await prisma?.post.deleteMany({ where: { authorId: { in: ids } } });
    // post_images không cascade theo user: xoá theo thư mục của từng user test.
    await prisma?.postImage.deleteMany({ where: { OR: ids.map((id) => ({ key: { startsWith: `posts/${id}/` } })) } });
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    if (topicId) await prisma?.topic.deleteMany({ where: { id: topicId } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it(
    'quyền viết theo loại tài khoản',
    async () => {
      expect((await me('get', '/permission', author).expect(200)).body).toEqual({ canWrite: true });
      expect((await me('get', '/permission', admin).expect(200)).body).toEqual({ canWrite: true });
      expect((await me('get', '/permission', plain).expect(200)).body).toEqual({ canWrite: false });
      const res = await me('post', '', plain).expect(403);
      expect(res.body.code).toBe('POST_WRITE_FORBIDDEN');
      await call('get', '/api/me/posts').expect(401);
    },
    SLOW,
  );

  it(
    'tạo nháp, lưu từng phần, tính phút đọc',
    async () => {
      postId = (await me('post', '', author).expect(201)).body.id as string;
      const saved = await me('patch', `/${postId}`, author, {
        title: `Bài viết e2e ${TAG}`,
        bodyHtml: `<h2>Mở đầu</h2><p>${'từ '.repeat(450)}</p>`,
      }).expect(200);
      expect(saved.body.status).toBe('draft');
      expect(saved.body.slug).toBeNull();
      const row = await prisma.post.findUniqueOrThrow({
        where: { id: postId },
        select: { readingMinutes: true, autoExcerpt: true },
      });
      expect(row.readingMinutes).toBe(2);
      expect(row.autoExcerpt.startsWith('Mở đầu từ từ')).toBe(true);
      expect(row.autoExcerpt.length).toBeLessThanOrEqual(300);
    },
    SLOW,
  );

  it(
    'xuất bản thiếu chủ đề → 400 chỉ đúng trường',
    async () => {
      const res = await me('post', `/${postId}/publish`, author).expect(400);
      expect(res.body.errors.map((e: { path: string[] }) => e.path[0])).toEqual(['topicIds', 'coverUrl']);
    },
    SLOW,
  );

  it(
    'chủ đề không tồn tại / khoá của người khác / ảnh bìa ngoài kho → 400',
    async () => {
      await me('patch', `/${postId}`, author, { topicIds: [randomUUID()] }).expect(400);
      await me('patch', `/${postId}`, author, { relatedCourseId: otherCourse }).expect(400);
      await me('patch', `/${postId}`, author, { coverUrl: 'https://evil.example/a.png' }).expect(400);
      await me('patch', `/${postId}`, author, { coverUrl: `${FakeStorage.PUBLIC}/posts/${other.id}/a.png` }).expect(400);
    },
    SLOW,
  );

  it(
    'đủ điều kiện → xuất bản, sinh slug, giữ slug khi đổi tiêu đề',
    async () => {
      await me('patch', `/${postId}`, author, {
        topicIds: [topicId],
        relatedCourseId: authorCourse,
        coverUrl: `${FakeStorage.PUBLIC}/posts/${author.id}/bia.png`,
      }).expect(200);
      const res = await me('post', `/${postId}/publish`, author).expect(200);
      expect(res.body.status).toBe('published');
      expect(res.body.slug).toBe(`bai-viet-e2e-${TAG}`);
      expect(res.body.publishedAt).toBeTruthy();
      slug = res.body.slug as string;
      const renamed = await me('patch', `/${postId}`, author, { title: `Tiêu đề mới ${TAG}` }).expect(200);
      expect(renamed.body.slug).toBe(slug);
    },
    SLOW,
  );

  it(
    'bài đã xuất bản không được lưu thành thiếu điều kiện',
    async () => {
      await me('patch', `/${postId}`, author, { title: '' }).expect(400);
      await me('patch', `/${postId}`, author, { topicIds: [] }).expect(400);
      await me('patch', `/${postId}`, author, { coverUrl: null }).expect(400);
    },
    SLOW,
  );

  it(
    'trùng tiêu đề → slug có hậu tố',
    async () => {
      const id = (await me('post', '', other).expect(201)).body.id as string;
      await me('patch', `/${id}`, other, {
        title: `Bài viết e2e ${TAG}`,
        bodyHtml: '<p>x</p>',
        topicIds: [topicId],
        coverUrl: `${FakeStorage.PUBLIC}/posts/${other.id}/bia.png`,
      }).expect(200);
      const res = await me('post', `/${id}/publish`, other).expect(200);
      expect(res.body.slug).toMatch(new RegExp(`^bai-viet-e2e-${TAG}-[a-z0-9]{6}$`));
    },
    SLOW,
  );

  it(
    'người khác không đọc, sửa, xoá được bài của mình',
    async () => {
      await me('get', `/${postId}`, other).expect(404);
      await me('patch', `/${postId}`, other, { title: 'x' }).expect(404);
      await me('delete', `/${postId}`, other).expect(404);
      await me('get', '/khong-phai-uuid', author).expect(404);
    },
    SLOW,
  );

  it(
    'xin URL tải ảnh: đúng thư mục của mình, chỉ nhận ảnh',
    async () => {
      const ok = await me('post', '/uploads', author, { fileName: 'a.png', mimeType: 'image/png', sizeBytes: 1000 }).expect(201);
      expect(ok.body.key).toMatch(new RegExp(`^posts/${author.id}/[0-9a-f-]{36}\\.png$`));
      expect(ok.body.publicUrl).toBe(`${FakeStorage.PUBLIC}/${ok.body.key}`);
      expect(ok.body.headers).toEqual({ 'Content-Type': 'image/png' });
      await me('post', '/uploads', author, { fileName: 'a.gif', mimeType: 'image/gif', sizeBytes: 1000 }).expect(400);
      await me('post', '/uploads', plain, { fileName: 'a.png', mimeType: 'image/png', sizeBytes: 1000 }).expect(403);
    },
    SLOW,
  );

  it(
    'gỡ về nháp rồi xuất bản lại: giữ slug và ngày xuất bản đầu',
    async () => {
      const before = await prisma.post.findUniqueOrThrow({ where: { id: postId }, select: { publishedAt: true } });
      expect((await me('post', `/${postId}/unpublish`, author).expect(200)).body.status).toBe('draft');
      await me('post', `/${postId}/unpublish`, author).expect(409);
      const again = await me('post', `/${postId}/publish`, author).expect(200);
      expect(again.body.slug).toBe(slug);
      expect(new Date(again.body.publishedAt as string).getTime()).toBe(before.publishedAt!.getTime());
    },
    SLOW,
  );

  it(
    'admin gỡ bài: tác giả thấy lý do, không tự xuất bản lại; admin mở lại về nháp',
    async () => {
      await call('post', `/api/admin/posts/${postId}/remove`, author.cookie, { reason: 'x' }).expect(403);
      await call('post', `/api/admin/posts/${postId}/remove`, admin.cookie, {}).expect(400);
      const removed = await call('post', `/api/admin/posts/${postId}/remove`, admin.cookie, {
        reason: 'Quảng cáo trá hình',
      }).expect(200);
      expect(removed.body.status).toBe('removed');
      const mine = (await me('get', '?status=removed', author).expect(200)).body as { id: string; removedReason: string }[];
      expect(mine.find((p) => p.id === postId)?.removedReason).toBe('Quảng cáo trá hình');
      expect((await me('post', `/${postId}/publish`, author).expect(409)).body.code).toBe('POST_REMOVED');
      const restored = await call('post', `/api/admin/posts/${postId}/restore`, admin.cookie).expect(200);
      expect(restored.body.status).toBe('draft');
      await me('post', `/${postId}/publish`, author).expect(200);
    },
    SLOW,
  );

  it(
    'admin tự viết và xuất bản được',
    async () => {
      const id = (await me('post', '', admin).expect(201)).body.id as string;
      await me('patch', `/${id}`, admin, {
        title: `Thông báo e2e ${TAG}`,
        bodyHtml: '<p>x</p>',
        topicIds: [topicId],
        coverUrl: `${FakeStorage.PUBLIC}/posts/${admin.id}/bia.png`,
      }).expect(200);
      expect((await me('post', `/${id}/publish`, admin).expect(200)).body.status).toBe('published');
    },
    SLOW,
  );

  it(
    'xoá bài',
    async () => {
      const id = (await me('post', '', author).expect(201)).body.id as string;
      await me('delete', `/${id}`, author).expect(204);
      await me('get', `/${id}`, author).expect(404);
    },
    SLOW,
  );

  describe('đọc công khai', () => {
    const feed = (query = '') => call('get', `/api/posts${query}`);

    it(
      'danh sách chỉ có bài đã xuất bản, kèm tóm tắt tự sinh và tác giả',
      async () => {
        const draft = (await me('post', '', author).expect(201)).body.id as string;
        await me('patch', `/${draft}`, author, { title: `Nháp e2e ${TAG}`, bodyHtml: '<p>x</p>', topicIds: [topicId] }).expect(200);
        const res = await feed(`?topic=${topicSlug}`).expect(200);
        const items = res.body.items as {
          id: string;
          excerpt: string;
          author: { id: string | null; name: string };
          topics: { slug: string }[];
        }[];
        expect(res.body.topic).toEqual({ slug: topicSlug, name: `Chủ đề e2e ${TAG}` });
        expect(items.some((p) => p.id === draft)).toBe(false);
        const mine = items.find((p) => p.id === postId)!;
        expect(mine.author).toMatchObject({ id: author.id, name: 'Tác Giả' });
        expect(mine.excerpt.startsWith('Mở đầu')).toBe(true);
        expect(mine.topics[0].slug).toBe(topicSlug);
        expect(JSON.stringify(res.body)).not.toContain('bodyHtml');
        expect(res.body.total).toBe(items.length);
      },
      SLOW,
    );

    it(
      'bài của admin hiện tác giả là Aolumi, không lộ tài khoản',
      async () => {
        const items = (await feed(`?topic=${topicSlug}`).expect(200)).body.items as { title: string; author: object }[];
        expect(items.find((p) => p.title === `Thông báo e2e ${TAG}`)!.author).toEqual({ id: null, name: 'Aolumi', image: null });
      },
      SLOW,
    );

    it(
      'tìm theo tiêu đề không dấu; chủ đề lạ → rỗng',
      async () => {
        const hit = (await feed(`?q=${encodeURIComponent(`tieu de moi ${TAG}`)}`).expect(200)).body.items as { id: string }[];
        expect(hit.map((p) => p.id)).toEqual([postId]);
        expect((await feed('?topic=khong-co-chu-de-nay').expect(200)).body).toMatchObject({ items: [], total: 0 });
      },
      SLOW,
    );

    it(
      'chủ đề có bài kèm số bài',
      async () => {
        const topics = (await call('get', '/api/post-topics').expect(200)).body as { slug: string; count: number }[];
        expect(Array.isArray(topics)).toBe(true);
        const all = await prisma.postTopic.count({ where: { topicId, post: { status: 'published' } } });
        const mine = topics.find((t) => t.slug === topicSlug);
        if (mine) expect(mine.count).toBe(all); // DB dev có thể có >12 chủ đề nhiều bài hơn
      },
      SLOW,
    );

    it(
      'chi tiết: nội dung, hồ sơ tác giả, khoá liên quan, bài khác của tác giả, bài cùng chủ đề',
      async () => {
        // Bài thứ hai của cùng tác giả, cùng chủ đề: chỉ hiện ở "bài khác của tác giả", không lặp ở "cùng chủ đề".
        const second = (await me('post', '', author).expect(201)).body.id as string;
        await me('patch', `/${second}`, author, {
          title: `Bài thứ hai e2e ${TAG}`,
          bodyHtml: '<p>x</p>',
          topicIds: [topicId],
          coverUrl: `${FakeStorage.PUBLIC}/posts/${author.id}/bia-2.png`,
        }).expect(200);
        await me('post', `/${second}/publish`, author).expect(200);

        const res = await call('get', `/api/posts/${slug}`).expect(200);
        expect(res.body.bodyHtml).toContain('<h2>Mở đầu</h2>');
        expect(res.body.author).toMatchObject({ id: author.id, name: 'Tác Giả', headline: null, bio: null });
        expect(res.body.relatedCourse.id).toBe(authorCourse);
        const fromAuthor = (res.body.fromAuthor as { id: string }[]).map((p) => p.id);
        expect(fromAuthor).toEqual([second]);
        const more = (res.body.more as { id: string }[]).map((p) => p.id);
        expect(more.length).toBeGreaterThan(0);
        expect(more).not.toContain(postId);
        expect(more).not.toContain(second);
      },
      SLOW,
    );

    it(
      'khoá liên quan bị gỡ khỏi catalog → null, bài vẫn đọc được',
      async () => {
        await prisma.course.update({ where: { id: authorCourse }, data: { status: 'draft' } });
        expect((await call('get', `/api/posts/${slug}`).expect(200)).body.relatedCourse).toBeNull();
        await prisma.course.update({ where: { id: authorCourse }, data: { status: 'published' } });
      },
      SLOW,
    );

    it(
      'bài nháp / bị gỡ / slug lạ → 404',
      async () => {
        await call('get', '/api/posts/khong-co-bai-nay').expect(404);
        await me('post', `/${postId}/unpublish`, author).expect(200);
        await call('get', `/api/posts/${slug}`).expect(404);
        await me('post', `/${postId}/publish`, author).expect(200);
        await call('post', `/api/admin/posts/${postId}/remove`, admin.cookie, { reason: 'thử' }).expect(200);
        await call('get', `/api/posts/${slug}`).expect(404);
        await call('post', `/api/admin/posts/${postId}/restore`, admin.cookie).expect(200);
        await me('post', `/${postId}/publish`, author).expect(200);
      },
      SLOW,
    );

    it(
      'bài theo tác giả; tài khoản nghiệp vụ và id lạ → rỗng',
      async () => {
        const mine = (await call('get', `/api/users/${author.id}/posts`).expect(200)).body as { id: string }[];
        expect(mine.map((p) => p.id)).toContain(postId);
        expect((await call('get', `/api/users/${admin.id}/posts`).expect(200)).body).toEqual([]);
        expect((await call('get', '/api/users/khong-phai-uuid/posts').expect(200)).body).toEqual([]);
      },
      SLOW,
    );
  });

  describe('ảnh bài viết', () => {
    const key = (u: TestUser, name: string) => `posts/${u.id}/${name}-${TAG}.png`;
    const url = (k: string) => `${FakeStorage.PUBLIC}/${k}`;
    const body = (...keys: string[]) => keys.map((k) => `<p><img src="${url(k)}" alt=""></p>`).join('') || '<p>chữ</p>';
    const image = (k: string) =>
      prisma.postImage.findUnique({ where: { key: k }, select: { orphanedAt: true, uses: { select: { postId: true } } } });
    const draft = async (u: TestUser) => (await me('post', '', u).expect(201)).body.id as string;

    it(
      'ký URL upload → có dòng, đang mồ côi',
      async () => {
        const res = await me('post', '/uploads', author, { fileName: 'a.png', mimeType: 'image/png', sizeBytes: 1000 }).expect(201);
        const row = await image(res.body.key as string);
        expect(row?.orphanedAt).toBeInstanceOf(Date);
        expect(row?.uses).toEqual([]);
      },
      SLOW,
    );

    it(
      'lưu bài có ảnh → đang dùng; lưu lại bỏ ảnh → mồ côi',
      async () => {
        const id = await draft(author);
        const a = key(author, 'luu-a');
        const b = key(author, 'luu-b');
        await me('patch', `/${id}`, author, { bodyHtml: body(a, b) }).expect(200);
        expect(await image(a)).toEqual({ orphanedAt: null, uses: [{ postId: id }] });
        expect(await image(b)).toEqual({ orphanedAt: null, uses: [{ postId: id }] });

        await me('patch', `/${id}`, author, { bodyHtml: body(a) }).expect(200);
        expect((await image(a))?.orphanedAt).toBeNull();
        const gone = await image(b);
        expect(gone?.uses).toEqual([]);
        expect(gone?.orphanedAt).toBeInstanceOf(Date);
      },
      SLOW,
    );

    it(
      'thay ảnh bìa → ảnh bìa cũ mồ côi',
      async () => {
        const id = await draft(author);
        const oldCover = key(author, 'bia-cu');
        const newCover = key(author, 'bia-moi');
        await me('patch', `/${id}`, author, { coverUrl: url(oldCover) }).expect(200);
        await me('patch', `/${id}`, author, { coverUrl: url(newCover) }).expect(200);
        expect((await image(oldCover))?.orphanedAt).toBeInstanceOf(Date);
        expect(await image(newCover)).toEqual({ orphanedAt: null, uses: [{ postId: id }] });
      },
      SLOW,
    );

    it(
      'ảnh dùng ở hai bài (kể cả bài người khác), bỏ ở một bài → vẫn đang dùng',
      async () => {
        const mine = await draft(author);
        const theirs = await draft(other);
        const shared = key(author, 'dung-chung');
        await me('patch', `/${mine}`, author, { bodyHtml: body(shared) }).expect(200);
        await me('patch', `/${theirs}`, other, { bodyHtml: body(shared) }).expect(200);
        await me('patch', `/${mine}`, author, { bodyHtml: body() }).expect(200);
        expect(await image(shared)).toEqual({ orphanedAt: null, uses: [{ postId: theirs }] });
      },
      SLOW,
    );

    it(
      'xoá bài → ảnh mồ côi',
      async () => {
        const id = await draft(author);
        const k = key(author, 'xoa-bai');
        await me('patch', `/${id}`, author, { bodyHtml: body(k) }).expect(200);
        await me('delete', `/${id}`, author).expect(204);
        const row = await image(k);
        expect(row?.uses).toEqual([]);
        expect(row?.orphanedAt).toBeInstanceOf(Date);
      },
      SLOW,
    );

    describe('job dọn', () => {
      const DAY = 24 * 3_600_000;
      const prefix = () => `posts/${author.id}/job-${TAG}-`;
      const png = Buffer.from('png');
      const seed = async (name: string, orphanedAt: Date | null) => {
        const k = `${prefix()}${name}.png`;
        await prisma.postImage.create({ data: { key: k, orphanedAt } });
        storage.put('public', k, png);
        return k;
      };
      const purge = () => app.get(AssetsCleanupService).purgeOrphanPostImages(prefix());

      it(
        'mồ côi quá 24 giờ → xoá dòng và file; dưới 24 giờ hoặc có bài dùng → giữ',
        async () => {
          const old = new Date(Date.now() - DAY - 3_600_000);
          const stale = await seed('cu', old);
          const fresh = await seed('moi', new Date());
          // orphanedAt cũ nhưng có cặp dùng (không đặt lại orphanedAt) → kiểm đúng điều kiện "không bài nào dùng".
          const used = await seed('dang-dung', old);
          const id = await draft(author);
          await prisma.postImageUse.create({ data: { postId: id, key: used } });

          expect(await purge()).toBe(1);
          expect(await image(stale)).toBeNull();
          expect(storage.has('public', stale)).toBe(false);
          expect(storage.has('public', fresh)).toBe(true);
          expect(storage.has('public', used)).toBe(true);
          expect((await image(used))?.uses).toEqual([{ postId: id }]);
        },
        SLOW,
      );

      it(
        'xoá file lỗi → dòng được tạo lại với orphanedAt cũ để lượt sau thử lại',
        async () => {
          const old = new Date(Date.now() - DAY - 3_600_000);
          const k = await seed('loi', old);
          const spy = vi.spyOn(storage, 'delete').mockRejectedValueOnce(new Error('R2 lỗi'));
          try {
            expect(await purge()).toBe(0);
          } finally {
            spy.mockRestore();
          }
          expect((await image(k))?.orphanedAt?.getTime()).toBe(old.getTime());
          expect(storage.has('public', k)).toBe(true);
        },
        SLOW,
      );
    });
  });
});
