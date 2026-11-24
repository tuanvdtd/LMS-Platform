import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import { type AddressInfo } from 'node:net';
import { io } from 'socket.io-client';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { RedisService } from '../src/infra/redis.js';
import { StorageService } from '../src/infra/storage.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeStorage } from './fake-storage.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const SLOW = 120_000; // DB dev ~1-2s/query

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'delete';

describe('Tin nhắn (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let redis: RedisService;
  const fakeStorage = new FakeStorage();
  const emails: string[] = [];
  let inst: TestUser;
  let stu: TestUser;
  let freeStu: TestUser;
  let stranger: TestUser;
  let mod: TestUser;
  let paidCourse: { id: string; slug: string };
  let freeCourse: { id: string; slug: string };
  let convId: string;

  const call = (method: Method, path: string, user?: TestUser) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    return user ? r.set('Cookie', user.cookie) : r;
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
  const makeCourse = (instructorId: string, priceAmount: number) =>
    prisma.course.create({
      data: { instructorId, title: 'E2E', slug: `e2e-${randomUUID()}`, priceAmount },
      select: { id: true, slug: true },
    });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .overrideProvider(StorageService)
      .useValue(fakeStorage)
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.listen(0);
    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
    [inst, stu, freeStu, stranger, mod] = await Promise.all([
      makeUser('student,instructor'),
      makeUser(),
      makeUser(),
      makeUser(),
      makeUser('moderator'),
    ]);
    [paidCourse, freeCourse] = await Promise.all([makeCourse(inst.id, 500_000), makeCourse(inst.id, 0)]);
    const order = await prisma.order.create({
      data: { userId: stu.id, status: 'paid', subtotalAmount: 500_000, totalAmount: 500_000, paidAt: new Date() },
    });
    await prisma.enrollment.createMany({
      data: [
        { userId: stu.id, courseId: paidCourse.id, orderId: order.id },
        { userId: freeStu.id, courseId: freeCourse.id },
      ],
    });
  }, SLOW);

  // course cascade → enrollment; order trước course; user cascade → conversation/message.
  afterAll(async () => {
    const ids = [inst, stu, freeStu, stranger, mod].filter(Boolean).map((u) => u.id);
    await prisma?.order.deleteMany({ where: { userId: { in: ids } } });
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await redis?.del(`rl:msg:${inst?.id}`, `rl:conv-new:${stu?.id}`, `rl:conv-new:${inst?.id}`);
    await app?.close();
  }, SLOW);

  it('mở cuộc cần ghi danh trả phí', async () => {
    await call('post', '/api/conversations', freeStu).send({ userId: inst.id }).expect(403).expect((r) => expect(r.body.code).toBe('NO_PAID_LINK'));
    await call('post', '/api/conversations', stranger).send({ userId: inst.id }).expect(403);
    const a = await call('post', '/api/conversations', stu).send({ userId: inst.id }).expect(201);
    const b = await call('post', '/api/conversations', inst).send({ userId: stu.id }).expect(201); // giảng viên chủ động, cùng cuộc
    expect(b.body.id).toBe(a.body.id);
    convId = a.body.id;
  }, SLOW);

  it('peer cho biết có nhắn được không', async () => {
    expect((await call('get', `/api/conversations/peer/${inst.id}`, stu).expect(200)).body).toEqual({ conversationId: convId, canMessage: true });
    expect((await call('get', `/api/conversations/peer/${inst.id}`, freeStu).expect(200)).body).toEqual({ conversationId: null, canMessage: false });
  }, SLOW);

  it('cuộc chưa có tin không hiện trong danh sách', async () => {
    expect((await call('get', '/api/conversations', stu).expect(200)).body.items).toEqual([]);
  }, SLOW);

  it('gửi, danh sách, chưa đọc, đã đọc', async () => {
    const m1 = await call('post', `/api/conversations/${convId}/messages`, stu).send({ body: '  Chào thầy\nem hỏi chút  ' }).expect(201);
    expect(m1.body).toMatchObject({ senderId: stu.id, body: 'Chào thầy\nem hỏi chút', images: [] });
    await call('post', `/api/conversations/${convId}/messages`, stu).send({ body: 'Thầy ơi' }).expect(201);
    const list = (await call('get', '/api/conversations', inst).expect(200)).body;
    expect(list.items[0]).toMatchObject({ id: convId, other: { id: stu.id }, unreadCount: 2, blocked: 'none', lastMessage: { body: 'Thầy ơi', senderIsMe: false, hasImages: false } });
    expect((await call('get', '/api/conversations/unread-count', inst).expect(200)).body).toEqual({ count: 1 });
    expect((await call('get', '/api/conversations/unread-count', stu).expect(200)).body).toEqual({ count: 0 }); // người gửi tự coi là đã đọc
    await call('post', `/api/conversations/${convId}/read`, inst).expect(204);
    expect((await call('get', '/api/conversations/unread-count', inst).expect(200)).body).toEqual({ count: 0 });
    const detail = (await call('get', `/api/conversations/${convId}`, stu).expect(200)).body;
    expect(detail.otherLastReadAt).not.toBeNull();
    expect(detail).toMatchObject({ canSend: true, reason: null, blocked: 'none' });
    expect(detail.courses).toEqual([expect.objectContaining({ slug: paidCourse.slug, otherIsStudent: false, progressPct: null, review: null })]);
    const instView = (await call('get', `/api/conversations/${convId}`, inst).expect(200)).body;
    expect(instView.courses[0]).toMatchObject({ otherIsStudent: true, progressPct: expect.any(Number) });
  }, SLOW);

  it('phân trang tin cũ hơn', async () => {
    const base = Date.now() - 3_600_000;
    await prisma.message.createMany({
      data: Array.from({ length: 35 }, (_, i) => ({ conversationId: convId, senderId: stu.id, body: `p${i}`, createdAt: new Date(base + i * 1000) })),
    });
    const p1 = (await call('get', `/api/conversations/${convId}/messages`, stu).expect(200)).body;
    expect(p1.items).toHaveLength(30); // mới nhất trước
    expect(p1.hasMore).toBe(true);
    const p2 = (await call('get', `/api/conversations/${convId}/messages?before=${p1.items[29].id}`, stu).expect(200)).body;
    expect(p2.items.length).toBeGreaterThan(0);
    expect(new Date(p2.items[0].createdAt) <= new Date(p1.items[29].createdAt)).toBe(true);
    expect(p2.items.map((m: { id: string }) => m.id)).not.toContain(p1.items[29].id);
  }, SLOW);

  it('không phải thành viên → 404; nội dung trống → 400', async () => {
    await call('get', `/api/conversations/${convId}`, stranger).expect(404);
    await call('post', `/api/conversations/${convId}/messages`, stranger).send({ body: 'x' }).expect(404);
    await call('post', `/api/conversations/${convId}/messages`, stu).send({ body: '   ' }).expect(400);
  }, SLOW);

  it('ảnh: xin link, gửi đúng key; key lạ / chưa tải → 400', async () => {
    const up = (await call('post', `/api/conversations/${convId}/images`, stu).send({ mimeType: 'image/png', sizeBytes: 1000 }).expect(201)).body;
    expect(up.key).toMatch(new RegExp(`^messages/${convId}/[0-9a-f-]{36}\\.png$`));
    await call('post', `/api/conversations/${convId}/messages`, stu).send({ body: '', imageKeys: [up.key] }).expect(400);
    fakeStorage.put('private', up.key, Buffer.alloc(1000));
    const m = (await call('post', `/api/conversations/${convId}/messages`, stu).send({ body: '', imageKeys: [up.key] }).expect(201)).body;
    expect(m.images).toEqual([{ key: up.key, url: expect.any(String) }]);
    await call('post', `/api/conversations/${convId}/messages`, stu).send({ body: 'x', imageKeys: ['messages/khac/a.png'] }).expect(400);
    // đúng định dạng, object có thật, nhưng thuộc cuộc khác → chỉ tiền tố cuộc chặn được
    const foreign = `messages/${randomUUID()}/${randomUUID()}.png`;
    fakeStorage.put('private', foreign, Buffer.alloc(10));
    await call('post', `/api/conversations/${convId}/messages`, stu).send({ body: 'x', imageKeys: [foreign] }).expect(400);
    // trùng key
    const k = (await call('post', `/api/conversations/${convId}/images`, stu).send({ mimeType: 'image/png', sizeBytes: 10 }).expect(201)).body.key;
    fakeStorage.put('private', k, Buffer.alloc(10));
    await call('post', `/api/conversations/${convId}/messages`, stu).send({ body: 'x', imageKeys: [k, k] }).expect(400);
    // object thực tế > 5 MB
    const big = (await call('post', `/api/conversations/${convId}/images`, stu).send({ mimeType: 'image/png', sizeBytes: 10 }).expect(201)).body.key;
    fakeStorage.put('private', big, Buffer.alloc(5 * 1024 * 1024 + 1));
    await call('post', `/api/conversations/${convId}/messages`, stu).send({ body: 'x', imageKeys: [big] }).expect(400);
    await call('post', `/api/conversations/${convId}/images`, stu).send({ mimeType: 'image/gif', sizeBytes: 10 }).expect(400);
    await call('post', `/api/conversations/${convId}/images`, stu).send({ mimeType: 'image/png', sizeBytes: 6 * 1024 * 1024 }).expect(400);
    await call('post', `/api/conversations/${convId}/images`, stranger).send({ mimeType: 'image/png', sizeBytes: 10 }).expect(404);
  }, SLOW);

  it('chặn / bỏ chặn', async () => {
    await call('post', `/api/conversations/${convId}/block`, stu).expect(204);
    await call('post', `/api/conversations/${convId}/messages`, inst).send({ body: 'x' }).expect(403).expect((r) => expect(r.body.code).toBe('BLOCKED_BY_OTHER'));
    await call('post', `/api/conversations/${convId}/messages`, stu).send({ body: 'x' }).expect(403).expect((r) => expect(r.body.code).toBe('BLOCKED_BY_ME'));
    await call('post', `/api/conversations/${convId}/block`, inst).expect(409);
    await call('delete', `/api/conversations/${convId}/block`, inst).expect(403);
    expect((await call('get', `/api/conversations/peer/${inst.id}`, stu).expect(200)).body.canMessage).toBe(false);
    await call('delete', `/api/conversations/${convId}/block`, stu).expect(204);
    await call('post', `/api/conversations/${convId}/messages`, inst).send({ body: 'Chào em' }).expect(201);
  }, SLOW);

  it('staff bị chặn', async () => {
    await call('get', '/api/conversations', mod).expect(403).expect((r) => expect(r.body.code).toBe('STAFF_ACCOUNT'));
  }, SLOW);

  describe('socket /messages', () => {
    const connect = (u: TestUser, origin = FE_URL) =>
      io(`http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/messages`, {
        transports: ['websocket'],
        reconnection: false,
        forceNew: true,
        extraHeaders: { Origin: origin, Cookie: u.cookie },
      });

    it('message:new tới cả hai người, conversation:read tới người kia', async () => {
      const sStu = connect(stu);
      const sInst = connect(inst);
      await Promise.all([sStu, sInst].map((s) => new Promise<void>((r) => s.on('connect', () => r()))));
      const got = new Promise<{ conversationId: string; message: { body: string } }>((r) => sInst.on('message:new', r));
      const echo = new Promise((r) => sStu.on('message:new', r)); // tab khác của người gửi
      await call('post', `/api/conversations/${convId}/messages`, stu).send({ body: 'realtime' }).expect(201);
      expect((await got).message.body).toBe('realtime');
      await echo;
      const seen = new Promise<{ userId: string }>((r) => sStu.on('conversation:read', r));
      await call('post', `/api/conversations/${convId}/read`, inst).expect(204);
      expect((await seen).userId).toBe(inst.id);
      const upd = new Promise((r) => sInst.on('conversation:updated', r));
      await call('post', `/api/conversations/${convId}/block`, stu).expect(204);
      await upd;
      await call('delete', `/api/conversations/${convId}/block`, stu).expect(204);
      sStu.close();
      sInst.close();
    }, SLOW);

    it('người ngoài cuộc không nhận message:new / conversation:read', async () => {
      const sStranger = connect(stranger);
      const sInst = connect(inst);
      try {
        await Promise.all([sStranger, sInst].map((s) => new Promise<void>((r) => s.on('connect', () => r()))));
        const leaked = vi.fn();
        sStranger.on('message:new', leaked);
        sStranger.on('conversation:read', leaked);
        const got = new Promise((r) => sInst.on('message:new', r));
        await call('post', `/api/conversations/${convId}/messages`, stu).send({ body: 'riêng tư' }).expect(201);
        await got;
        await call('post', `/api/conversations/${convId}/read`, inst).expect(204);
        await new Promise((r) => setTimeout(r, 300));
        expect(leaked).not.toHaveBeenCalled();
      } finally {
        sStranger.close();
        sInst.close();
      }
    }, SLOW);

    it('từ chối origin lạ', async () => {
      const s = connect(stu, 'https://evil.example');
      await expect(new Promise((_, rej) => s.on('connect_error', rej))).rejects.toThrow('forbidden');
      s.close();
    }, SLOW);
  });

  it('giới hạn 20 tin/phút', async () => {
    await redis.del(`rl:msg:${inst.id}`);
    for (let i = 0; i < 20; i++) await call('post', `/api/conversations/${convId}/messages`, inst).send({ body: `t${i}` }).expect(201);
    await call('post', `/api/conversations/${convId}/messages`, inst).send({ body: 'quá' }).expect(429);
  }, SLOW);
});
