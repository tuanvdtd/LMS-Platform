import '../src/env.js';
import { readFileSync, readdirSync } from 'node:fs';
import { Prisma, PrismaClient } from '@prisma/client';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import type { CategoryNode } from '../src/categories/categories.service.js';
import { setupApp } from '../src/setup-app.js';

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

class Rollback extends Error {}
async function inRollback(fn: (tx: Prisma.TransactionClient) => Promise<void>) {
  await prisma
    .$transaction(async (tx) => {
      await fn(tx);
      throw new Rollback();
    })
    .catch((e: unknown) => {
      if (!(e instanceof Rollback)) throw e;
    });
}

const seedDir = readdirSync('prisma/migrations').find((d) => d.endsWith('_category_topics_seed'));
const seedSql = () => readFileSync(`prisma/migrations/${seedDir}/migration.sql`, 'utf8');

describe('category_topics — seed', () => {
  it('có 185 dòng, chỉ gắn vào category cấp 2, mỗi cấp 2 tối đa 9 topic', async () => {
    expect(await prisma.categoryTopic.count()).toBe(185);
    const rows = await prisma.categoryTopic.findMany({ include: { category: true } });
    expect(rows.every((r) => r.category.parentId !== null)).toBe(true);
    const perCat = new Map<string, number>();
    for (const r of rows) perCat.set(r.categoryId, (perCat.get(r.categoryId) ?? 0) + 1);
    expect(Math.max(...perCat.values())).toBeLessThanOrEqual(9);
  });

  it('Phát triển web: đúng 9 topic theo thứ tự position 1..9', async () => {
    const web = await prisma.category.findUnique({
      where: { slug: 'web-development' },
      include: { popularTopics: { orderBy: { position: 'asc' }, include: { topic: true } } },
    });
    const slugs = web!.popularTopics.map((p) => p.topic.slug);
    expect(slugs).toEqual([
      'javascript', 'angular', 'react', 'typescript', 'fastapi', 'aspnet-core', 'html', 'nodejs', 'nextjs',
    ]);
    expect(web!.popularTopics.map((p) => p.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('một topic nằm được ở nhiều cấp 2 (python)', async () => {
    const n = await prisma.categoryTopic.count({ where: { topic: { slug: 'python' } } });
    expect(n).toBeGreaterThanOrEqual(2);
  });

  it('chạy seed lần 2 không sinh dòng mới', () =>
    inRollback(async (tx) => {
      await tx.$executeRawUnsafe(seedSql());
      expect(await tx.categoryTopic.count()).toBe(185);
    }));
});

describe('GET /api/categories/tree', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
  });
  afterAll(() => app.close());

  it('public, có Cache-Control', () =>
    request(app.getHttpServer())
      .get('/api/categories/tree')
      .expect(200)
      .expect('Cache-Control', 'public, max-age=300'));

  it('tầng ngoài = category cấp 1 trong DB, đúng thứ tự position; con không có children', async () => {
    const { body } = await request(app.getHttpServer()).get('/api/categories/tree');
    const tree = body as CategoryNode[];
    const roots = await prisma.category.findMany({ where: { parentId: null }, orderBy: { position: 'asc' } });
    expect(tree.map((c) => c.slug)).toEqual(roots.map((r) => r.slug));
    const dev = tree.find((c) => c.slug === 'development')!;
    const devKids = await prisma.category.findMany({
      where: { parent: { slug: 'development' } },
      orderBy: { position: 'asc' },
    });
    expect(dev.children.map((c) => c.slug)).toEqual(devKids.map((k) => k.slug));
    expect(dev.children.every((c) => !('children' in c))).toBe(true);
    expect(Object.keys(tree[0]).sort()).toEqual(['children', 'name', 'slug']);
    expect(Object.keys(dev.children[0]).sort()).toEqual(['name', 'slug', 'topics']);
  });

  it('web-development có topic javascript đứng đầu', async () => {
    const { body } = await request(app.getHttpServer()).get('/api/categories/tree');
    const web = (body as CategoryNode[]).flatMap((c) => c.children).find((c) => c.slug === 'web-development')!;
    expect(web.topics[0]).toEqual({ slug: 'javascript', name: 'JavaScript' });
  });
});
