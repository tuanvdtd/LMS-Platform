import '../src/env.js';
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

// Mỗi test chạy trong transaction rồi rollback, không để lại rác trong DB dev.
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

const uid = () => randomUUID().slice(0, 8);

async function makeCourse(tx: Prisma.TransactionClient) {
  const user = await tx.user.create({
    data: { id: randomUUID(), name: 't', email: `tx-${uid()}@example.com` },
  });
  const root = await tx.category.create({ data: { slug: `r-${uid()}`, name: 'r' } });
  const leaf = await tx.category.create({
    data: { slug: `l-${uid()}`, name: 'l', parentId: root.id },
  });
  const course = await tx.course.create({
    data: {
      instructorId: user.id,
      slug: `c-${uid()}`,
      title: 't',
      categoryId: leaf.id,
      track: 'frontend',
      level: 'beginner',
    },
  });
  return { user, root, leaf, course };
}

describe('Taxonomy — constraint', () => {
  it('mỗi khoá tối đa 1 topic chính', () =>
    inRollback(async (tx) => {
      const { course } = await makeCourse(tx);
      const [t1, t2, t3] = await Promise.all(
        [1, 2, 3].map(() => tx.topic.create({ data: { slug: `t-${uid()}`, name: 't' } })),
      );
      await tx.courseTopic.create({ data: { courseId: course.id, topicId: t1.id, isPrimary: true } });
      await tx.courseTopic.create({ data: { courseId: course.id, topicId: t2.id } });
      await expect(
        tx.courseTopic.create({ data: { courseId: course.id, topicId: t3.id, isPrimary: true } }),
      ).rejects.toThrow();
    }));

  it('category không được sâu quá 2 cấp', () =>
    inRollback(async (tx) => {
      const { leaf } = await makeCourse(tx);
      await expect(
        tx.category.create({ data: { slug: `g-${uid()}`, name: 'g', parentId: leaf.id } }),
      ).rejects.toThrow(/2 tầng/);
    }));

  it('topic không được tiên quyết chính nó', () =>
    inRollback(async (tx) => {
      const t = await tx.topic.create({ data: { slug: `t-${uid()}`, name: 't' } });
      await expect(
        tx.topic.update({ where: { id: t.id }, data: { prerequisites: { connect: { id: t.id } } } }),
      ).rejects.toThrow();
    }));

  it('mastery score nằm trong 0..1', () =>
    inRollback(async (tx) => {
      const { user } = await makeCourse(tx);
      const t = await tx.topic.create({ data: { slug: `t-${uid()}`, name: 't' } });
      await expect(
        tx.userTopicMastery.create({ data: { userId: user.id, topicId: t.id, score: 1.5 } }),
      ).rejects.toThrow();
    }));

  it('quiz gắn được topic', () =>
    inRollback(async (tx) => {
      const { course } = await makeCourse(tx);
      const t = await tx.topic.create({ data: { slug: `t-${uid()}`, name: 't' } });
      const quiz = await tx.quiz.create({ data: { courseId: course.id, title: 'q' } });
      await tx.quizTopic.create({ data: { quizId: quiz.id, topicId: t.id } });
      expect(await tx.quizTopic.count({ where: { quizId: quiz.id } })).toBe(1);
    }));

  it('có index trigram cho tên topic', async () => {
    const rows = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes WHERE indexname = 'idx_topics_name_trgm'`;
    expect(rows).toHaveLength(1);
  });
});

describe('Taxonomy — seed', () => {
  const L2: Record<string, string[]> = {
    'artificial-intelligence': [
      'ai-fundamentals', 'ai-for-developers', 'machine-learning', 'generative-ai-creative',
    ],
    development: [
      'web-development', 'data-science', 'mobile-apps', 'programming-languages',
      'game-development', 'databases', 'software-testing', 'software-engineering',
      'development-tools', 'no-code-development',
    ],
    'it-and-software': [
      'it-certification', 'network-and-security', 'hardware', 'operating-systems',
      'other-it-and-software',
    ],
    design: [
      'web-design', 'graphic-design-and-illustration', 'design-tools', 'user-experience',
      'game-design', '3d-and-animation',
    ],
  };

  it('có đúng 4 cấp 1 và 25 cấp 2 theo Udemy, không còn nhánh cũ', async () => {
    const all = await prisma.category.findMany({ include: { parent: true } });
    const roots = all.filter((c) => !c.parentId).map((c) => c.slug).sort();
    expect(roots).toEqual(Object.keys(L2).sort());
    for (const [root, kids] of Object.entries(L2)) {
      const actual = all.filter((c) => c.parent?.slug === root).map((c) => c.slug).sort();
      expect(actual).toEqual([...kids].sort());
    }
    expect(all.find((c) => ['lap-trinh', 'khoa-hoc-du-lieu', 'cntt-ha-tang', 'web'].includes(c.slug)))
      .toBeUndefined();
  });

  it('có 159 topic, tên tiếng Việt theo Udemy', async () => {
    expect(await prisma.topic.count()).toBe(159);
    const ml = await prisma.topic.findUnique({ where: { slug: 'machine-learning' } });
    expect(ml?.name).toBe('Học máy');
  });

  it('cạnh tiên quyết đúng chiều: css cần html, react cần javascript', async () => {
    const css = await prisma.topic.findUnique({
      where: { slug: 'css' },
      include: { prerequisites: true },
    });
    expect(css?.prerequisites.map((t) => t.slug)).toEqual(['html']);
    const react = await prisma.topic.findUnique({
      where: { slug: 'react' },
      include: { prerequisites: true, requiredBy: true },
    });
    expect(react?.prerequisites.map((t) => t.slug)).toEqual(['javascript']);
    expect(react?.requiredBy.map((t) => t.slug).sort()).toEqual(['nextjs', 'react-native']);
    const [{ n }] = await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) n FROM "_TopicPrereq"`;
    expect(n).toBe(17n);
  });
});
