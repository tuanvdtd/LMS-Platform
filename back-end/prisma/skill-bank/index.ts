// Nạp ngân hàng câu kỹ năng: chỉ chèn cho topic CHƯA có câu nào (chạy lại vô hại, không đè câu admin đã sửa).
// Dùng: pnpm seed:skills (cần .env). Nội dung thật của nền tảng → chạy cả ở prod.
import { randomUUID } from 'node:crypto';
import prismaPkg from '@prisma/client';
import { DIFFICULTY_RATING } from '../../src/skills/skill-elo.ts';
import { SKILL_BANK } from './data/index.ts';
import { validateBank } from './validate.ts';

const { PrismaClient } = prismaPkg;

async function main() {
  const errs = validateBank(SKILL_BANK, { strict: true });
  if (errs.length) throw new Error(`Ngân hàng câu chưa hợp lệ:\n- ${errs.join('\n- ')}`);
  const prisma = new PrismaClient();
  try {
    for (const [slug, questions] of Object.entries(SKILL_BANK)) {
      const topic = await prisma.topic.findUnique({ where: { slug }, select: { id: true } });
      if (!topic) throw new Error(`Không có topic ${slug}`);
      if (await prisma.skillQuestion.count({ where: { topicId: topic.id } })) {
        console.log(`- ${slug}: đã có câu, bỏ qua`);
        continue;
      }
      // id sinh sẵn → 2 createMany / topic thay vì 40 nested create (DB dev ~1–2 s/query).
      const rows = questions.map((q) => ({ id: randomUUID(), q }));
      await prisma.$transaction([
        prisma.skillQuestion.createMany({
          data: rows.map(({ id, q }) => ({
            id, topicId: topic.id, type: q.type, stem: q.stem, difficulty: q.difficulty, rating: DIFFICULTY_RATING[q.difficulty],
          })),
        }),
        prisma.skillQuestionOption.createMany({
          data: rows.flatMap(({ id, q }) =>
            q.options.map((o, position) => ({ questionId: id, content: o.content, isCorrect: !!o.correct, position })),
          ),
        }),
      ]);
      console.log(`✓ ${slug}: ${questions.length} câu`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
