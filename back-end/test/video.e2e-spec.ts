import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PROMO_MAX_BYTES } from '../src/assets/file-check.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { StorageService } from '../src/infra/storage.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeStorage } from './fake-storage.js';
import { mp4, pdf } from './fixtures/files.js';

// spec video-upload §7. Bootstrap giống curriculum.e2e-spec.ts.
const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const SLOW = 120_000;

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
type VideoRef = {
  id: string;
  fileName: string;
  sizeBytes: number;
  durationSec: number | null;
};
type Item = {
  id: string;
  type: string;
  lectureKind: string | null;
  durationSec: number;
  video: VideoRef | null;
};
type Tree = {
  sections: { id: string; items: Item[] }[];
  checklist: { key: string; missing: { message: string }[] }[];
};

describe('Video bài giảng + video giới thiệu (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const storage = new FakeStorage();
  const emails: string[] = [];
  let alice: TestUser;
  let bob: TestUser;

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
    await call('post', '/api/auth/sign-up/email', undefined, {
      name: 'E2E',
      email,
      password: PASSWORD,
    }).expect(200);
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true, role: 'student,instructor' },
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
        title: 'Khoá e2e video',
      }).expect(201)
    ).body.id as string;
  // Ký URL rồi "upload" thẳng vào FakeStorage (thay trình duyệt PUT).
  const uploaded = async (
    u: TestUser,
    kind: 'video' | 'promo',
    body: Buffer,
    sizeBytes = body.length,
    durationSec = 754,
  ) => {
    const res = await call('post', '/api/instructor/assets/uploads', u.cookie, {
      kind,
      fileName: kind === 'video' ? 'bai-giang.mp4' : 'gioi-thieu.mp4',
      mimeType: 'video/mp4',
      sizeBytes,
      ...(kind === 'video' ? { durationSec } : {}),
    }).expect(201);
    storage.put(kind === 'video' ? 'video' : 'public', res.body.key, body);
    return res.body as { assetId: string | null; key: string };
  };
  const readyVideo = (ownerId: string, durationSec: number) =>
    prisma.asset.create({
      data: {
        ownerId,
        kind: 'video',
        fileName: `v-${durationSec}.mp4`,
        mimeType: 'video/mp4',
        sizeBytes: 1000,
        storageKey: `videos/${ownerId}/${randomUUID()}.mp4`,
        status: 'ready',
        durationSec,
      },
    });

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
    [alice, bob] = await Promise.all([makeUser(), makeUser()]);
  }, SLOW);

  // Dọn: course trước (item → asset là Restrict), asset, rồi user.
  afterAll(async () => {
    const ids = [alice, bob].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  describe('/api/instructor/assets', () => {
    it('ký upload video → asset uploading trên bucket video; promo → không tạo asset', async () => {
      const video = await uploaded(alice, 'video', mp4(10));
      expect(video.key).toMatch(new RegExp(`^videos/${alice.id}/[0-9a-f-]{36}\\.mp4$`));
      const asset = await prisma.asset.findUniqueOrThrow({
        where: { id: video.assetId! },
      });
      expect(asset).toMatchObject({
        kind: 'video',
        status: 'uploading',
        mimeType: 'video/mp4',
      });

      const before = await prisma.asset.count({ where: { ownerId: alice.id } });
      const promo = await uploaded(alice, 'promo', mp4(10));
      expect(promo.assetId).toBeNull();
      expect(promo.key).toMatch(new RegExp(`^promos/${alice.id}/[0-9a-f-]{36}\\.mp4$`));
      expect(await prisma.asset.count({ where: { ownerId: alice.id } })).toBe(before);
    }, SLOW);

    it('video > 1 GB / > 24 giờ / thiếu durationSec, promo > 200 MB, MIME khác MP4 → 400', async () => {
      const bad = [
        {
          kind: 'video',
          fileName: 'a.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 1024 ** 3 + 1,
          durationSec: 10,
        },
        {
          kind: 'video',
          fileName: 'a.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 10,
          durationSec: 24 * 3600 + 1,
        },
        { kind: 'video', fileName: 'a.mp4', mimeType: 'video/mp4', sizeBytes: 10 },
        {
          kind: 'video',
          fileName: 'a.mov',
          mimeType: 'video/quicktime',
          sizeBytes: 10,
          durationSec: 10,
        },
        {
          kind: 'promo',
          fileName: 'a.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 200 * 1024 ** 2 + 1,
        },
        {
          kind: 'promo',
          fileName: 'a.webm',
          mimeType: 'video/webm',
          sizeBytes: 10,
        },
      ];
      for (const b of bad) await call('post', '/api/instructor/assets/uploads', alice.cookie, b).expect(400);
    }, SLOW);

    it(
      'complete video đúng → ready + durationSec từ client; lệch cỡ / không phải MP4 → 400, failed, object bị xoá',
      async () => {
        // File 10 giây nhưng client khai 754 → server giữ 754 (không tự đo, spec V5).
        const ok = await uploaded(alice, 'video', mp4(10, { moovLast: true }), undefined, 754);
        const res = await call('post', `/api/instructor/assets/${ok.assetId}/complete`, alice.cookie).expect(200);
        expect(res.body).toMatchObject({
          id: ok.assetId,
          kind: 'video',
          durationSec: 754,
        });

        const lied = await uploaded(alice, 'video', mp4(10), mp4(10).length + 1);
        await call('post', `/api/instructor/assets/${lied.assetId}/complete`, alice.cookie).expect(400);
        expect(storage.has('video', lied.key)).toBe(false);

        const fake = await uploaded(alice, 'video', pdf);
        const bad = await call('post', `/api/instructor/assets/${fake.assetId}/complete`, alice.cookie).expect(400);
        expect(bad.body.errors[0].message).toBe('File không phải video MP4 hợp lệ');
        expect(storage.has('video', fake.key)).toBe(false);
        expect(
          (
            await prisma.asset.findUniqueOrThrow({
              where: { id: fake.assetId! },
            })
          ).status,
        ).toBe('failed');
      },
      SLOW,
    );

    it(
      'complete MP4 phân mảnh (mvhd duration = 0) → ready, durationSec theo client',
      async () => {
        const frag = await uploaded(alice, 'video', mp4(0), undefined, 120);
        const res = await call('post', `/api/instructor/assets/${frag.assetId}/complete`, alice.cookie).expect(200);
        expect(res.body).toMatchObject({ id: frag.assetId, durationSec: 120 });
        expect((await prisma.asset.findUniqueOrThrow({ where: { id: frag.assetId! } })).status).toBe('ready');
      },
      SLOW,
    );

    it(
      'thư viện lọc theo kind; URL xem video ký trên bucket video; người khác → 404',
      async () => {
        const v = await readyVideo(alice.id, 30);
        const videos = await call('get', '/api/instructor/assets?kind=video', alice.cookie).expect(200);
        expect(videos.body.every((a: { kind: string }) => a.kind === 'video')).toBe(true);
        expect(videos.body.find((a: { id: string }) => a.id === v.id)).toMatchObject({ durationSec: 30 });
        const docs = await call('get', '/api/instructor/assets', alice.cookie).expect(200);
        expect(docs.body.some((a: { kind: string }) => a.kind === 'video')).toBe(false);

        const url = await call('get', `/api/instructor/assets/${v.id}/url`, alice.cookie).expect(200);
        expect(url.body.url).toBe(`https://fake.r2/video/${v.storageKey}?signed=1`);
        await call('get', `/api/instructor/assets/${v.id}/url`, bob.cookie).expect(404);
      },
      SLOW,
    );
  });

  describe('/api/instructor/courses/:id/promo-video', () => {
    let courseId: string;
    const put = (u: TestUser, key: string) =>
      call('put', `/api/instructor/courses/${courseId}/promo-video`, u.cookie, { key });

    beforeAll(async () => {
      courseId = await newCourse(alice);
    }, SLOW);

    it(
      'gắn video → promoVideoUrl; thay → object cũ bị xoá; gỡ → null + xoá object',
      async () => {
        const first = await uploaded(alice, 'promo', mp4(90));
        const a = await put(alice, first.key).expect(200);
        expect(a.body.promoVideoUrl).toBe(`${FakeStorage.PUBLIC}/${first.key}`);

        const second = await uploaded(alice, 'promo', mp4(60));
        const b = await put(alice, second.key).expect(200);
        expect(b.body.promoVideoUrl).toBe(`${FakeStorage.PUBLIC}/${second.key}`);
        expect(storage.has('public', first.key)).toBe(false);

        const c = await call('delete', `/api/instructor/courses/${courseId}/promo-video`, alice.cookie).expect(200);
        expect(c.body.promoVideoUrl).toBeNull();
        expect(storage.has('public', second.key)).toBe(false);
      },
      SLOW,
    );

    it(
      'key của người khác / không phải MP4 → 400 (object lỗi bị xoá); khoá in_review → 409',
      async () => {
        const bobs = await uploaded(bob, 'promo', mp4(30));
        const foreign = await put(alice, bobs.key).expect(400);
        expect(foreign.body.errors[0].message).toBe('Video không hợp lệ');
        expect(storage.has('public', bobs.key)).toBe(true);

        const fake = await uploaded(alice, 'promo', pdf);
        const res = await put(alice, fake.key).expect(400);
        expect(res.body.errors[0].message).toBe('File không phải video MP4 hợp lệ');
        expect(storage.has('public', fake.key)).toBe(false);

        const ok = await uploaded(alice, 'promo', mp4(30));
        await prisma.course.update({ where: { id: courseId }, data: { status: 'in_review' } });
        await put(alice, ok.key).expect(409);
        await call('delete', `/api/instructor/courses/${courseId}/promo-video`, alice.cookie).expect(409);
        await prisma.course.update({ where: { id: courseId }, data: { status: 'draft' } });
      },
      SLOW,
    );

    it(
      'key chưa upload → 400; quá 200 MB (server kiểm) → 400 + object bị xoá',
      async () => {
        const missing = await put(alice, `promos/${alice.id}/${randomUUID()}.mp4`).expect(400);
        expect(missing.body.errors[0].message).toBe('Chưa tải video lên');

        const big = await uploaded(alice, 'promo', mp4(30));
        const spy = vi.spyOn(storage, 'head').mockResolvedValueOnce({ size: PROMO_MAX_BYTES + 1 });
        try {
          const res = await put(alice, big.key).expect(400);
          expect(res.body.errors[0].message).toBe('Video giới thiệu tối đa 200 MB');
        } finally {
          spy.mockRestore();
        }
        expect(storage.has('public', big.key)).toBe(false);
      },
      SLOW,
    );
  });

  describe('curriculum: gắn video', () => {
    let courseId: string;
    let tree: Tree;
    const as = (method: Method, path: string, body?: object) =>
      call(method, `/api/instructor/courses/${courseId}${path}`, alice.cookie, body);
    const minutesMissing = () =>
      tree.checklist.find((c) => c.key === 'curriculum')!.missing.some((m) => m.message.includes('phút video'));

    beforeAll(async () => {
      courseId = await newCourse(alice);
    }, SLOW);

    it(
      'gắn video → lectureKind video, durationSec chép từ asset; 5 bài × 6 phút → checklist hết dòng phút video',
      async () => {
        tree = (await as('get', '/curriculum').expect(200)).body as Tree;
        const sectionId = tree.sections[0].id;
        for (let i = 0; i < 4; i++) {
          await as('post', `/sections/${sectionId}/items`, { type: 'lecture', title: `Bài ${i + 2}` }).expect(201);
        }
        tree = (await as('get', '/curriculum').expect(200)).body as Tree;
        const lectures = tree.sections[0].items.filter((i) => i.type === 'lecture');
        expect(lectures).toHaveLength(5);
        expect(minutesMissing()).toBe(true);

        for (const lecture of lectures) {
          const v = await readyVideo(alice.id, 360);
          tree = (await as('put', `/items/${lecture.id}/content`, { assetId: v.id }).expect(200)).body as Tree;
        }
        const first = tree.sections[0].items.find((i) => i.id === lectures[0].id)!;
        expect(first).toMatchObject({
          lectureKind: 'video',
          durationSec: 360,
          video: { fileName: 'v-360.mp4', sizeBytes: 1000, durationSec: 360 },
        });
        expect(minutesMissing()).toBe(false);

        tree = (await as('delete', `/items/${lectures[0].id}/content`).expect(200)).body as Tree;
        expect(tree.sections[0].items.find((i) => i.id === lectures[0].id)).toMatchObject({
          lectureKind: null,
          durationSec: 0,
          video: null,
        });
        expect(minutesMissing()).toBe(true);
      },
      SLOW,
    );
  });
});
