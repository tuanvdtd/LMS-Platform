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
import { exe, jpg, pdf, png } from './fixtures/files.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const SLOW = 120_000; // DB dev ~1-2s/query, mỗi mutation curriculum ~8-10 query

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
type Item = {
  id: string;
  type: string;
  title: string;
  isPublished: boolean;
  lectureKind: string | null;
  description: string | null;
  isPreview: boolean;
  document: { id: string } | null;
  resources: { id: string; title: string }[];
};
type Tree = {
  sections: { id: string; title: string; items: Item[] }[];
  checklist: { key: string; missing: { message: string }[] }[];
};

describe('Assets + ảnh bìa + khung chương trình (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const storage = new FakeStorage();
  const emails: string[] = [];
  let alice: TestUser; // giảng viên chính
  let bob: TestUser; // giảng viên khác

  const call = (method: Method, path: string, cookie?: string, body?: object) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    const withCookie = cookie ? r.set('Cookie', cookie) : r;
    return body ? withCookie.send(body) : withCookie;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (role: string): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email', undefined, {
      name: 'E2E',
      email,
      password: PASSWORD,
    }).expect(200);
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true, role },
    });
    const res = await call('post', '/api/auth/sign-in/email', undefined, {
      email,
      password: PASSWORD,
    }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };
  const newCourse = async (u: TestUser) =>
    (
      await call('post', '/api/instructor/courses', u.cookie, {
        title: 'Khoá e2e curriculum',
      }).expect(201)
    ).body.id as string;
  const readyAsset = (ownerId: string, fileName = 'tai-lieu.pdf') =>
    prisma.asset.create({
      data: {
        ownerId,
        kind: 'document',
        fileName,
        mimeType: 'application/pdf',
        sizeBytes: 1000,
        storageKey: `documents/${ownerId}/${randomUUID()}.pdf`,
        status: 'ready',
      },
    });
  // Ký URL rồi "upload" thẳng vào FakeStorage.
  const uploaded = async (
    u: TestUser,
    kind: 'document' | 'thumbnail',
    body: Buffer,
    mimeType: string,
    sizeBytes = body.length,
  ) => {
    const res = await call('post', '/api/instructor/assets/uploads', u.cookie, {
      kind,
      fileName: kind === 'document' ? 'bai.pdf' : 'bia.png',
      mimeType,
      sizeBytes,
    }).expect(201);
    storage.put(kind === 'document' ? 'private' : 'public', res.body.key, body);
    return res.body as { assetId: string | null; key: string };
  };

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
    [alice, bob] = await Promise.all([makeUser('student,instructor'), makeUser('student,instructor')]);
  }, SLOW);

  // Dọn: course trước (section/item/resource cascade; item → asset là Restrict), asset, rồi user.
  afterAll(async () => {
    const ids = [alice, bob].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  describe('/api/instructor/assets', () => {
    it('ký upload PDF → asset uploading, key do BE sinh, URL bucket private', async () => {
      const { body } = await call('post', '/api/instructor/assets/uploads', alice.cookie, {
        kind: 'document',
        fileName: 'bai-1.pdf',
        mimeType: 'application/pdf',
        sizeBytes: pdf.length,
      }).expect(201);
      expect(body.key).toMatch(new RegExp(`^documents/${alice.id}/[0-9a-f-]{36}\\.pdf$`));
      expect(body).toEqual({
        assetId: expect.any(String),
        key: body.key,
        uploadUrl: `https://fake.r2/private/${body.key}`,
        headers: { 'Content-Type': 'application/pdf' },
      });
      const asset = await prisma.asset.findUniqueOrThrow({
        where: { id: body.assetId },
      });
      expect(asset).toMatchObject({
        ownerId: alice.id,
        kind: 'document',
        status: 'uploading',
        storageKey: body.key,
      });
    });

    it('ký upload ảnh bìa → không tạo asset, key thumbnails/{me}/…', async () => {
      const { body } = await call('post', '/api/instructor/assets/uploads', alice.cookie, {
        kind: 'thumbnail',
        fileName: 'bia.webp',
        mimeType: 'image/webp',
        sizeBytes: 100,
      }).expect(201);
      expect(body.assetId).toBeNull();
      expect(body.key).toMatch(new RegExp(`^thumbnails/${alice.id}/[0-9a-f-]{36}\\.webp$`));
    });

    it('khai báo sai loại / quá cỡ / kind lạ → 400', async () => {
      const bad = [
        {
          kind: 'document',
          fileName: 'a.pdf',
          mimeType: 'image/png',
          sizeBytes: 10,
        },
        {
          kind: 'document',
          fileName: 'a.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024 ** 3 + 1,
        },
        {
          kind: 'thumbnail',
          fileName: 'a.gif',
          mimeType: 'image/gif',
          sizeBytes: 10,
        },
        {
          kind: 'thumbnail',
          fileName: 'a.png',
          mimeType: 'image/png',
          sizeBytes: 5 * 1024 ** 2 + 1,
        },
        {
          kind: 'audio',
          fileName: 'a.mp3',
          mimeType: 'audio/mpeg',
          sizeBytes: 10,
        },
      ];
      for (const b of bad) await call('post', '/api/instructor/assets/uploads', alice.cookie, b).expect(400);
    });

    it(
      'complete: chưa upload / sai cỡ / exe đổi đuôi → 400, failed, object bị xoá',
      async () => {
        const missing = await call('post', '/api/instructor/assets/uploads', alice.cookie, {
          kind: 'document',
          fileName: 'a.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 10,
        }).expect(201);
        await call('post', `/api/instructor/assets/${missing.body.assetId}/complete`, alice.cookie).expect(400);

        const wrongSize = await uploaded(alice, 'document', pdf, 'application/pdf', pdf.length + 1);
        const r1 = await call('post', `/api/instructor/assets/${wrongSize.assetId}/complete`, alice.cookie).expect(400);
        expect(r1.body.errors[0]).toMatchObject({
          path: ['file'],
          message: 'Kích thước file không khớp lúc khai báo',
        });

        const fake = await uploaded(alice, 'document', exe, 'application/pdf');
        const r2 = await call('post', `/api/instructor/assets/${fake.assetId}/complete`, alice.cookie).expect(400);
        expect(r2.body.errors[0].message).toBe('File không phải PDF');
        expect(storage.has('private', fake.key)).toBe(false);

        const statuses = await prisma.asset.findMany({
          where: {
            id: {
              in: [missing.body.assetId, wrongSize.assetId!, fake.assetId!],
            },
          },
          select: { status: true },
        });
        expect(statuses.every((a) => a.status === 'failed')).toBe(true);
      },
      SLOW,
    );

    it(
      'complete PDF thật → 200 ready; gọi lại / người khác → 404',
      async () => {
        const ok = await uploaded(alice, 'document', pdf, 'application/pdf');
        const other = await uploaded(alice, 'document', pdf, 'application/pdf');
        await call('post', `/api/instructor/assets/${other.assetId}/complete`, bob.cookie).expect(404);
        const { body } = await call('post', `/api/instructor/assets/${ok.assetId}/complete`, alice.cookie).expect(200);
        expect(body).toEqual({
          id: ok.assetId,
          kind: 'document',
          fileName: 'bai.pdf',
          sizeBytes: pdf.length,
          durationSec: null,
          createdAt: expect.any(String),
        });
        await call('post', `/api/instructor/assets/${ok.assetId}/complete`, alice.cookie).expect(404);
        await call('post', '/api/instructor/assets/abc/complete', alice.cookie).expect(404);
      },
      SLOW,
    );

    it(
      'thư viện: chỉ PDF ready của mình, lọc theo tên; URL xem chỉ chủ file',
      async () => {
        const mine = await readyAsset(alice.id, 'Slide Docker Compose.pdf');
        await readyAsset(bob.id, 'Slide Docker của Bob.pdf');
        const all = (await call('get', '/api/instructor/assets', alice.cookie).expect(200)).body as { id: string }[];
        expect(all.map((a) => a.id)).toContain(mine.id);
        const filtered = (await call('get', '/api/instructor/assets?q=docker', alice.cookie).expect(200)).body as {
          fileName: string;
        }[];
        expect(filtered.map((a) => a.fileName)).toEqual(['Slide Docker Compose.pdf']);
        const url = await call('get', `/api/instructor/assets/${mine.id}/url`, alice.cookie).expect(200);
        expect(url.body.url).toBe(`https://fake.r2/private/${mine.storageKey}?signed=1`);
        await call('get', `/api/instructor/assets/${mine.id}/url`, bob.cookie).expect(404);
      },
      SLOW,
    );
  });

  describe('PUT /api/instructor/courses/:id/thumbnail', () => {
    let courseId: string;
    const put = (key: string, u = alice) =>
      call('put', `/api/instructor/courses/${courseId}/thumbnail`, u.cookie, {
        key,
      });
    beforeAll(async () => {
      courseId = await newCourse(alice);
    }, SLOW);

    it(
      'ảnh hợp lệ → thumbnailUrl mới, checklist hết dòng ảnh bìa; thay ảnh → ảnh cũ bị xoá',
      async () => {
        const first = await uploaded(alice, 'thumbnail', png(800, 450), 'image/png');
        const r1 = await put(first.key).expect(200);
        expect(r1.body.thumbnailUrl).toBe(`${FakeStorage.PUBLIC}/${first.key}`);
        const basics = (r1.body.checklist as Tree['checklist']).find((c) => c.key === 'basics')!;
        expect(basics.missing.map((m) => m.message)).not.toContain('Chưa có ảnh bìa');

        const second = await uploaded(alice, 'thumbnail', jpg(1280, 720), 'image/jpeg');
        const r2 = await put(second.key).expect(200);
        expect(r2.body.thumbnailUrl).toBe(`${FakeStorage.PUBLIC}/${second.key}`);
        expect(storage.has('public', first.key)).toBe(false);
        expect(storage.has('public', second.key)).toBe(true);
      },
      SLOW,
    );

    it(
      'ảnh cũ còn khoá khác dùng chung → không xoá object',
      async () => {
        const otherId = await newCourse(alice);
        const shared = await uploaded(alice, 'thumbnail', png(800, 450), 'image/png');
        await put(shared.key).expect(200);
        await call('put', `/api/instructor/courses/${otherId}/thumbnail`, alice.cookie, { key: shared.key }).expect(
          200,
        );
        const next = await uploaded(alice, 'thumbnail', jpg(1280, 720), 'image/jpeg');
        await put(next.key).expect(200);
        expect(storage.has('public', shared.key)).toBe(true);
      },
      SLOW,
    );

    it(
      'ảnh nhỏ / exe đổi đuôi → 400, object bị xoá, ảnh cũ giữ nguyên',
      async () => {
        const before = (await call('get', `/api/instructor/courses/${courseId}`, alice.cookie).expect(200)).body
          .thumbnailUrl;
        const small = await uploaded(alice, 'thumbnail', png(700, 400), 'image/png');
        const r1 = await put(small.key).expect(400);
        expect(r1.body.errors[0]).toEqual({
          path: ['key'],
          message: 'Ảnh tối thiểu 750×422 px',
        });
        expect(storage.has('public', small.key)).toBe(false);
        const fake = await uploaded(alice, 'thumbnail', exe, 'image/png');
        await put(fake.key).expect(400);
        const after = (await call('get', `/api/instructor/courses/${courseId}`, alice.cookie).expect(200)).body
          .thumbnailUrl;
        expect(after).toBe(before);
      },
      SLOW,
    );

    it(
      'key của người khác / chưa upload / sai mẫu → 400; khoá của người khác → 404',
      async () => {
        const bobs = await uploaded(bob, 'thumbnail', png(800, 450), 'image/png');
        await put(bobs.key).expect(400);
        await put(`thumbnails/${alice.id}/${randomUUID()}.png`).expect(400);
        await put('../../etc/passwd').expect(400);
        await put(bobs.key, bob).expect(404);
      },
      SLOW,
    );

    it(
      'khoá in_review → 409',
      async () => {
        await prisma.course.update({
          where: { id: courseId },
          data: { status: 'in_review' },
        });
        const img = await uploaded(alice, 'thumbnail', png(800, 450), 'image/png');
        const res = await put(img.key).expect(409);
        expect(res.body.code).toBe('COURSE_LOCKED');
        await prisma.course.update({
          where: { id: courseId },
          data: { status: 'draft' },
        });
      },
      SLOW,
    );
  });

  describe('/api/instructor/courses/:id/curriculum…', () => {
    let courseId: string;
    let tree: Tree;
    const as = (method: Method, path: string, body?: object) =>
      call(method, `/api/instructor/courses/${courseId}${path}`, alice.cookie, body);
    const save = (res: Response) => {
      tree = res.body as Tree;
      return tree;
    };
    const sectionTitles = () => tree.sections.map((s) => s.title);
    const itemTitles = (sectionId: string) => tree.sections.find((s) => s.id === sectionId)!.items.map((i) => i.title);
    const lectureMissing = () =>
      tree.checklist.find((c) => c.key === 'curriculum')!.missing.some((m) => m.message.includes('bài giảng'));

    beforeAll(async () => {
      courseId = await newCourse(alice);
    }, SLOW);

    it('GET: phần + bài giảng mặc định, kèm checklist', async () => {
      save(await as('get', '/curriculum').expect(200));
      expect(tree.sections).toHaveLength(1);
      expect(tree.sections[0]).toMatchObject({
        title: 'Giới thiệu',
        items: [{ type: 'lecture', title: 'Giới thiệu', isPublished: false, document: null, resources: [] }],
      });
      expect(tree.checklist.map((c) => c.key)).toEqual(['goals', 'curriculum', 'basics']);
    });

    it(
      'thêm / đổi tên phần; dữ liệu sai → 400',
      async () => {
        await as('post', '/sections', { title: 'Docker cơ bản' }).expect(201);
        save(await as('post', '/sections', { title: 'Compose' }).expect(201));
        expect(sectionTitles()).toEqual(['Giới thiệu', 'Docker cơ bản', 'Compose']);
        const compose = tree.sections[2].id;
        save(await as('patch', `/sections/${compose}`, { title: '  Docker Compose ' }).expect(200));
        expect(sectionTitles()[2]).toBe('Docker Compose');
        const bad = await as('patch', `/sections/${compose}`, { title: '' }).expect(400);
        expect(bad.body.errors[0].path).toEqual(['title']);
        await as('post', '/sections', { title: 'x'.repeat(81) }).expect(400);
        await as('patch', `/sections/${randomUUID()}`, { title: 'A' }).expect(404);
      },
      SLOW,
    );

    it(
      'thêm mục 4 loại; loại lạ → 400; isPreview cho quiz → 400, cho lecture → OK',
      async () => {
        const docker = tree.sections[1].id;
        for (const [type, title] of [
          ['lecture', 'Cài Docker'],
          ['quiz', 'Ôn tập Docker'],
          ['practice_test', 'Thi thử'],
          ['coding_exercise', 'Viết Dockerfile'],
        ]) {
          save(await as('post', `/sections/${docker}/items`, { type, title }).expect(201));
        }
        expect(itemTitles(docker)).toEqual(['Cài Docker', 'Ôn tập Docker', 'Thi thử', 'Viết Dockerfile']);
        await as('post', `/sections/${docker}/items`, { type: 'assignment', title: 'X' }).expect(400);
        const [lecture, quiz] = tree.sections[1].items;
        const bad = await as('patch', `/items/${quiz.id}`, { isPreview: true }).expect(400);
        expect(bad.body.errors[0].path).toEqual(['isPreview']);
        save(
          await as('patch', `/items/${lecture.id}`, { description: ' Cài trên Ubuntu ', isPreview: true }).expect(200),
        );
        expect(tree.sections[1].items[0]).toMatchObject({ description: 'Cài trên Ubuntu', isPreview: true });
      },
      SLOW,
    );

    it(
      'move phần: lên đầu, index quá lớn → cuối',
      async () => {
        const [intro, docker, compose] = tree.sections.map((s) => s.id);
        save(await as('post', `/sections/${compose}/move`, { index: 0 }).expect(200));
        expect(tree.sections.map((s) => s.id)).toEqual([compose, intro, docker]);
        save(await as('post', `/sections/${compose}/move`, { index: 99 }).expect(200));
        expect(tree.sections.map((s) => s.id)).toEqual([intro, docker, compose]);
        const db = await prisma.section.findMany({
          where: { courseId },
          orderBy: { position: 'asc' },
          select: { id: true },
        });
        expect(db.map((s) => s.id)).toEqual([intro, docker, compose]);
      },
      SLOW,
    );

    it(
      'move mục trong phần và sang phần khác; DB đánh số liền mạch',
      async () => {
        const docker = tree.sections[1];
        const compose = tree.sections[2];
        const [lec, quiz, test, code] = docker.items.map((i) => i.id);
        save(await as('post', `/items/${code}/move`, { sectionId: docker.id, index: 0 }).expect(200));
        expect(tree.sections[1].items.map((i) => i.id)).toEqual([code, lec, quiz, test]);
        save(await as('post', `/items/${quiz}/move`, { sectionId: compose.id, index: 0 }).expect(200));
        expect(tree.sections[1].items.map((i) => i.id)).toEqual([code, lec, test]);
        expect(tree.sections[2].items.map((i) => i.id)).toEqual([quiz]);
        for (const sectionId of [docker.id, compose.id]) {
          const rows = await prisma.curriculumItem.findMany({ where: { sectionId }, orderBy: { position: 'asc' } });
          expect(rows.map((r) => r.position)).toEqual(rows.map((_, i) => i));
        }
      },
      SLOW,
    );

    it(
      'move sang phần của khoá khác / id sai → 404',
      async () => {
        const bobCourse = await newCourse(bob);
        const bobSection = await prisma.section.findFirstOrThrow({ where: { courseId: bobCourse } });
        const item = tree.sections[1].items[0].id;
        await as('post', `/items/${item}/move`, { sectionId: bobSection.id, index: 0 }).expect(404);
        await as('post', `/items/${item}/move`, { sectionId: randomUUID(), index: 0 }).expect(404);
        await as('post', '/items/abc/move', { sectionId: tree.sections[0].id, index: 0 }).expect(404);
        await as('post', `/items/${item}/move`, { sectionId: 'abc', index: 0 }).expect(400);
      },
      SLOW,
    );

    it('gắn PDF → xuất bản; đủ 5 bài giảng → checklist hết dòng bài giảng; gỡ → chưa xuất bản', async () => {
      const intro = tree.sections[0].id;
      for (const title of ['Bài 2', 'Bài 3', 'Bài 4']) {
        save(await as('post', `/sections/${intro}/items`, { type: 'lecture', title }).expect(201));
      }
      const lectures = tree.sections.flatMap((s) => s.items).filter((i) => i.type === 'lecture');
      expect(lectures).toHaveLength(5);
      for (const lecture of lectures) {
        const asset = await readyAsset(alice.id);
        save(await as('put', `/items/${lecture.id}/content`, { assetId: asset.id }).expect(200));
      }
      const published = tree.sections.flatMap((s) => s.items).filter((i) => i.type === 'lecture');
      expect(published.every((i) => i.isPublished && i.lectureKind === 'document' && i.document)).toBe(true);
      expect(lectureMissing()).toBe(false);

      save(await as('delete', `/items/${lectures[0].id}/content`).expect(200));
      const removed = tree.sections.flatMap((s) => s.items).find((i) => i.id === lectures[0].id)!;
      expect(removed).toMatchObject({ isPublished: false, lectureKind: null, document: null });
      expect(lectureMissing()).toBe(true);
    }, 300_000);

    it(
      'gắn asset không hợp lệ / gắn cho quiz → 400',
      async () => {
        const lecture = tree.sections.flatMap((s) => s.items).find((i) => i.type === 'lecture')!;
        const quiz = tree.sections.flatMap((s) => s.items).find((i) => i.type === 'quiz')!;
        const bobs = await readyAsset(bob.id);
        const uploading = await prisma.asset.create({
          data: {
            ownerId: alice.id,
            kind: 'document',
            fileName: 'x.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 1,
            storageKey: `documents/${alice.id}/${randomUUID()}.pdf`,
          },
        });
        const video = await prisma.asset.create({
          data: {
            ownerId: alice.id,
            kind: 'video',
            fileName: 'v.mp4',
            mimeType: 'video/mp4',
            sizeBytes: 1,
            storageKey: `videos/${alice.id}/${randomUUID()}.mp4`,
            status: 'ready',
          },
        });
        for (const assetId of [bobs.id, uploading.id, randomUUID()]) {
          const res = await as('put', `/items/${lecture.id}/content`, { assetId }).expect(400);
          expect(res.body.errors[0].path).toEqual(['assetId']);
        }
        // Video gắn làm nội dung được (spec video-upload §4.5), nhưng không làm tài nguyên đính kèm.
        await as('post', `/items/${lecture.id}/resources`, { assetId: video.id }).expect(400);
        const mine = await readyAsset(alice.id);
        await as('put', `/items/${quiz.id}/content`, { assetId: mine.id }).expect(400);
      },
      SLOW,
    );

    it(
      'tài nguyên: tiêu đề mặc định = tên file, tối đa 10, xoá được',
      async () => {
        const lecture = tree.sections.flatMap((s) => s.items).find((i) => i.type === 'lecture')!;
        const asset = await readyAsset(alice.id, 'Cheat sheet.pdf');
        save(await as('post', `/items/${lecture.id}/resources`, { assetId: asset.id }).expect(201));
        const added = tree.sections.flatMap((s) => s.items).find((i) => i.id === lecture.id)!.resources;
        expect(added).toEqual([
          { id: expect.any(String), title: 'Cheat sheet.pdf', asset: expect.objectContaining({ id: asset.id }) },
        ]);
        // Có sẵn 1 → seed thêm 9 thẳng DB cho nhanh → cái thứ 11 bị chặn.
        await prisma.lectureResource.createMany({
          data: Array.from({ length: 9 }, (_, i) => ({
            itemId: lecture.id,
            assetId: asset.id,
            title: `R${i}`,
            position: i + 1,
          })),
        });
        const full = await as('post', `/items/${lecture.id}/resources`, { assetId: asset.id }).expect(400);
        expect(full.body.errors[0].message).toBe('Tối đa 10 tài nguyên mỗi bài giảng');
        save(await as('delete', `/resources/${added[0].id}`).expect(200));
        expect(tree.sections.flatMap((s) => s.items).find((i) => i.id === lecture.id)!.resources).toHaveLength(9);
      },
      SLOW,
    );

    it(
      'xoá mục; xoá phần kéo theo mục bên trong',
      async () => {
        const compose = tree.sections[2];
        const itemIds = compose.items.map((i) => i.id);
        save(await as('delete', `/items/${tree.sections[1].items[0].id}`).expect(200));
        save(await as('delete', `/sections/${compose.id}`).expect(200));
        expect(tree.sections.map((s) => s.id)).not.toContain(compose.id);
        expect(await prisma.curriculumItem.count({ where: { id: { in: itemIds } } })).toBe(0);
      },
      SLOW,
    );

    it(
      'khoá in_review → mutation 409, GET 200; giảng viên khác → 404',
      async () => {
        await prisma.course.update({ where: { id: courseId }, data: { status: 'in_review' } });
        const res = await as('post', '/sections', { title: 'Mới' }).expect(409);
        expect(res.body.code).toBe('COURSE_LOCKED');
        await as('get', '/curriculum').expect(200);
        await prisma.course.update({ where: { id: courseId }, data: { status: 'draft' } });
        await call('get', `/api/instructor/courses/${courseId}/curriculum`, bob.cookie).expect(404);
        await call('post', `/api/instructor/courses/${courseId}/sections`, bob.cookie, { title: 'X' }).expect(404);
      },
      SLOW,
    );
  });
});
