// Đo Precision@K của gợi ý trên danh mục khoá thật. CHỈ ĐỌC DB; học viên và lượt làm bài sinh trong bộ nhớ.
import prismaPkg from '@prisma/client';
import type { Occupation } from '@prisma/client';
import { MIN_ACTIVE_QUESTIONS } from '../../src/skills/skill-elo.ts';
import { type Catalog, KS, type Q, runEval, SEED } from './simulate.ts';

const { PrismaClient } = prismaPkg;
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
const log = (s = '') => console.log(s);

async function main() {
  const prisma = new PrismaClient();
  try {
    const [topicRows, courseRows, occRows, questionRows] = await Promise.all([
      prisma.topic.findMany({ select: { id: true, slug: true, name: true, prerequisites: { select: { id: true } } } }),
      prisma.course.findMany({
        where: { status: 'published' },
        orderBy: { createdAt: 'desc' }, // cùng thứ tự đầu vào với API thật
        select: { id: true, level: true, ratingAvg: true, topics: { select: { topicId: true, isPrimary: true } } },
      }),
      prisma.occupationTopic.findMany({
        orderBy: [{ occupation: 'asc' }, { position: 'asc' }],
        select: { occupation: true, topicId: true },
      }),
      prisma.skillQuestion.findMany({
        where: { archivedAt: null },
        orderBy: { id: 'asc' },
        select: { id: true, topicId: true, rating: true, answerCount: true, correctCount: true },
      }),
    ]);

    const questions = new Map<string, Q[]>();
    for (const q of questionRows) questions.set(q.topicId, [...(questions.get(q.topicId) ?? []), q]);
    // Topic chưa đủ câu thì API cũng không cho làm bài → không tính là đo được.
    for (const [topicId, qs] of questions) if (qs.length < MIN_ACTIVE_QUESTIONS) questions.delete(topicId);
    if (!questions.size) throw new Error('Chưa có topic nào đủ câu hỏi — chạy pnpm seed:skills trước');

    const byOccupation = new Map<Occupation, string[]>();
    for (const r of occRows) byOccupation.set(r.occupation, [...(byOccupation.get(r.occupation) ?? []), r.topicId]);

    const catalog: Catalog = {
      topics: new Map(topicRows.map((t) => [t.id, { id: t.id, slug: t.slug, name: t.name }])),
      prereqs: new Map(topicRows.filter((t) => t.prerequisites.length).map((t) => [t.id, t.prerequisites.map((p) => p.id)])),
      courses: courseRows.map((c) => ({ ...c, ratingAvg: Number(c.ratingAvg) })),
      occupations: [...byOccupation].filter(([, ids]) => ids.length >= 2).map(([value, topicIds]) => ({ value, topicIds })),
      questions,
    };
    const r = runEval(catalog);

    log(`# Precision@K của gợi ý (seed ${SEED})`);
    log();
    log(`- Học viên giả lập: ${r.learners} (đủ điều kiện ${r.eligible}, loại ${r.excluded} vì không có lỗ hổng gốc nào có khoá dạy)`);
    log(`- Tỉ lệ cặp (học viên, topic) yếu thật: ${pct(r.weakShare)}`);
    log(`- Khoá đã xuất bản: ${catalog.courses.length}`);
    log();
    log('| Topic đo được | Số câu hỏi | Số khoá lấy làm topic chính |');
    log('| --- | --- | --- |');
    for (const [topicId, qs] of [...questions].sort((a, b) => catalog.topics.get(a[0])!.slug.localeCompare(catalog.topics.get(b[0])!.slug))) {
      const n = catalog.courses.filter((c) => c.topics.some((t) => t.isPrimary && t.topicId === topicId)).length;
      log(`| ${catalog.topics.get(topicId)!.name} | ${qs.length} | ${n} |`);
    }
    log();
    log(`| Thuật toán | ${KS.map((k) => `P@${k}`).join(' | ')} |`);
    log(`| --- | ${KS.map(() => '---').join(' | ')} |`);
    for (const row of r.table1) log(`| ${row.name} | ${KS.map((k) => pct(row.p[k])).join(' | ')} |`);
    log();
    log(`Số topic mỗi học viên đo, trung bình: ${r.avgMeasured.toFixed(1)}; làm theo lời mời: ${r.avgMeasuredInvited.toFixed(1)} (trên ${questions.size} topic đo được).`);
    log();
    log(`| Nếu việc đo tốt hơn (có đồ thị tiên quyết) | ${KS.map((k) => `P@${k}`).join(' | ')} |`);
    log(`| --- | ${KS.map(() => '---').join(' | ')} |`);
    for (const row of r.table3) log(`| ${row.name} | ${KS.map((k) => pct(row.p[k])).join(' | ')} |`);
    log();
    log('| Số lượt đo mỗi topic | P@5 (có đồ thị tiên quyết) |');
    log('| --- | --- |');
    for (const row of r.table2) log(`| ${row.attempts} | ${pct(row.p5)} |`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
