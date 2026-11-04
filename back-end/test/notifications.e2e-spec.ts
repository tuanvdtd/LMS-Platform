import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { io, type Socket } from 'socket.io-client';
import request, { type Response } from 'supertest';
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
type Dto = { id: string; type: string; title: string; body: string; link: string | null; data: unknown; read: boolean; createdAt: string };

describe('Thông báo (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let stu: TestUser;
  let other: TestUser;
  let mod: TestUser;
  let ids: string[]; // 25 thông báo của stu, mới nhất trước
  let otherId: string; // thông báo của other

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
  const list = async (user: TestUser, query = '') => (await call('get', `/api/notifications${query}`, user).expect(200)).body as {
    items: Dto[];
    nextCursor: string | null;
    unreadCount: number;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .overrideProvider(StorageService)
      .useValue(new FakeStorage())
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.listen(0); // socket.io (Task 2) cần cổng thật
    prisma = app.get(PrismaService);
    [stu, other, mod] = await Promise.all([makeUser(), makeUser(), makeUser('moderator')]);
    // 25 bản, cách nhau 1 phút; chẵn = verdict, lẻ = qa_answer; 5 bản cũ nhất đã đọc.
    const base = Date.now() - 60 * 60_000;
    await prisma.notification.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        userId: stu.id,
        type: i % 2 === 0 ? ('verdict' as const) : ('qa_answer' as const),
        title: `T${i}`,
        body: `B${i}`,
        link: `/learn/x/code/y?submission=${i}`,
        data: { i },
        createdAt: new Date(base + i * 60_000),
        readAt: i < 5 ? new Date() : null,
      })),
    });
    ids = (
      await prisma.notification.findMany({ where: { userId: stu.id }, orderBy: { createdAt: 'desc' }, select: { id: true } })
    ).map((n) => n.id);
    otherId = (
      await prisma.notification.create({
        data: { userId: other.id, type: 'verdict', title: 'O', body: 'O', data: {} },
        select: { id: true },
      })
    ).id;
  }, SLOW);

  // user cascade → notification.
  const sockets: Socket[] = [];
  const connect = (user?: TestUser, origin = FE_URL) =>
    new Promise<Socket>((resolve, reject) => {
      const { port } = app.getHttpServer().address() as AddressInfo;
      const s = io(`http://127.0.0.1:${port}`, {
        transports: ['websocket'],
        reconnection: false,
        forceNew: true,
        extraHeaders: { Origin: origin, ...(user && { Cookie: user.cookie }) },
      });
      sockets.push(s);
      s.on('connect', () => resolve(s));
      s.on('connect_error', reject);
    });

  afterAll(async () => {
    for (const s of sockets) s.close();
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it('chưa đăng nhập → 401; moderator (staff) được dùng', async () => {
    await call('get', '/api/notifications').expect(401);
    expect((await list(mod)).items).toEqual([]);
  }, SLOW);

  it('trang 1: 20 mục mới nhất, nextCursor, unreadCount; trang 2: 5 mục còn lại', async () => {
    const p1 = await list(stu);
    expect(p1.items.map((n) => n.id)).toEqual(ids.slice(0, 20));
    expect(p1.nextCursor).toBe(ids[19]);
    expect(p1.unreadCount).toBe(20);
    expect(p1.items[0]).toEqual({
      id: ids[0],
      type: 'verdict',
      title: 'T24',
      body: 'B24',
      link: '/learn/x/code/y?submission=24',
      data: { i: 24 },
      read: false,
      createdAt: expect.any(String),
    });
    const p2 = await list(stu, `?cursor=${p1.nextCursor}`);
    expect(p2.items.map((n) => n.id)).toEqual(ids.slice(20));
    expect(p2.nextCursor).toBeNull();
    expect(p2.items.at(-1)!.read).toBe(true);
  }, SLOW);

  it('lọc type; cursor của người khác → trang rỗng; tham số sai → 400', async () => {
    const qa = await list(stu, '?type=qa_answer');
    expect(qa.items).toHaveLength(12);
    expect(qa.items.every((n) => n.type === 'qa_answer')).toBe(true);
    expect(qa.unreadCount).toBe(20); // không theo type
    expect(await list(stu, `?cursor=${otherId}`)).toEqual({ items: [], nextCursor: null, unreadCount: 20 });
    await call('get', '/api/notifications?cursor=abc', stu).expect(400);
    await call('get', '/api/notifications?type=xyz', stu).expect(400);
    await call('post', '/api/notifications/abc/read', stu).expect(400);
    await call('delete', '/api/notifications/abc', stu).expect(400);
  }, SLOW);

  it('đánh dấu 1 bản; id của người khác → 204 không đổi gì', async () => {
    await call('post', `/api/notifications/${ids[0]}/read`, stu).expect(204);
    await call('post', `/api/notifications/${ids[0]}/read`, stu).expect(204); // lặp lại vẫn 204
    expect((await list(stu)).unreadCount).toBe(19);
    await call('post', `/api/notifications/${otherId}/read`, stu).expect(204);
    expect((await prisma.notification.findUniqueOrThrow({ where: { id: otherId } })).readAt).toBeNull();
  }, SLOW);

  it('đánh dấu tất cả chỉ của mình', async () => {
    await call('post', '/api/notifications/read-all', stu).expect(204);
    const p = await list(stu);
    expect(p.unreadCount).toBe(0);
    expect(p.items.every((n) => n.read)).toBe(true);
    expect((await list(other)).unreadCount).toBe(1);
  }, SLOW);

  it('xoá: của mình mất; của người khác vẫn còn; xoá 2 lần vẫn 204', async () => {
    await call('delete', `/api/notifications/${ids[0]}`, stu).expect(204);
    await call('delete', `/api/notifications/${ids[0]}`, stu).expect(204);
    expect((await list(stu)).items.map((n) => n.id)).not.toContain(ids[0]);
    await call('delete', `/api/notifications/${otherId}`, stu).expect(204);
    expect(await prisma.notification.count({ where: { id: otherId } })).toBe(1);
  }, SLOW);

  it('socket: thiếu cookie → unauthorized; sai Origin → forbidden', async () => {
    await expect(connect()).rejects.toThrow('unauthorized');
    await expect(connect(stu, 'https://evil.example')).rejects.toThrow('forbidden');
  }, SLOW);

  it('socket: push tới đúng user (mọi tab), user khác không nhận', async () => {
    const [a, b, c] = await Promise.all([connect(stu), connect(stu), connect(other)]);
    const got = { a: [] as Dto[], b: [] as Dto[], c: [] as Dto[] };
    a.on('notification:new', (n: Dto) => got.a.push(n));
    b.on('notification:new', (n: Dto) => got.b.push(n));
    c.on('notification:new', (n: Dto) => got.c.push(n));
    const row = await prisma.notification.create({
      data: { userId: stu.id, type: 'verdict', title: 'Kết quả chấm bài', body: 'x', link: '/l', data: { status: 'accepted' } },
    });
    app.get(NotificationsGateway).push(row);
    await vi.waitFor(() => expect(got.a).toHaveLength(1));
    await vi.waitFor(() => expect(got.b).toHaveLength(1));
    expect(got.a[0]).toEqual({
      id: row.id,
      type: 'verdict',
      title: 'Kết quả chấm bài',
      body: 'x',
      link: '/l',
      data: { status: 'accepted' },
      read: false,
      createdAt: row.createdAt.toISOString(),
    });
    await new Promise((r) => setTimeout(r, 300));
    expect(got.c).toEqual([]);
  }, SLOW);
});
