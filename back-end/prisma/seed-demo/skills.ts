import type { PrismaClient } from '@prisma/client';
import { COOLDOWN_MS, expected, pickNext, QUESTIONS_PER_ATTEMPT, rate, START_RATING } from '../../src/skills/skill-elo.ts';
import { DAY, HOUR, type Rng } from './rng.ts';

type Q = { id: string; rating: number; answerCount: number; correctCount: number };
export type SkillPlan = {
  attempts: { id: string; userId: string; topicId: string; startedAt: Date; finishedAt: Date; ratingBefore: number; ratingAfter: number }[];
  answers: {
    attemptId: string; questionId: string; position: number; servedAt: Date; answeredAt: Date; isCorrect: boolean;
    userRatingBefore: number; userRatingAfter: number; questionRatingBefore: number; questionRatingAfter: number;
  }[];
  skills: { userId: string; topicId: string; rating: number; answerCount: number; lastStartedAt: Date }[];
  questions: Map<string, Q>; // R / số lượt sau mô phỏng
};

// Mô phỏng học viên làm bài qua đúng engine thật. Thuần (rng có seed, id sinh bằng rng) → test được, chạy lại ra y hệt.
export function planSkillHistory(
  input: { now: Date; learners: { userId: string; topicId: string; ability: number; attempts?: number }[]; questions: Map<string, Q[]> },
  rng: Rng,
): SkillPlan {
  const qs = new Map([...input.questions.values()].flat().map((q) => [q.id, { ...q }]));
  const plan: SkillPlan = { attempts: [], answers: [], skills: [], questions: qs };
  const id = () => [8, 4, 4, 4, 12].map((n) => Array.from({ length: n }, () => Math.floor(rng() * 16).toString(16)).join('')).join('-');
  for (const l of input.learners) {
    const pool = input.questions.get(l.topicId) ?? [];
    const seen = new Map<string, number>();
    let rating = START_RATING;
    let n = 0;
    // Không truyền attempts thì ngẫu nhiên 1–3 lượt (dữ liệu demo); phép đo gợi ý cần cố định số lượt.
    const k = l.attempts ?? 1 + Math.floor(rng() * 3);
    let lastStartedAt = input.now;
    for (let i = 0; i < k; i++) {
      // Lượt i cách nhau ~3 ngày, lượt cuối cách hiện tại ≥ 2 ngày → không vướng thời gian chờ 24h.
      const startedAt = new Date(input.now.getTime() - (k - i) * 3 * DAY + Math.floor(rng() * 12) * HOUR);
      const attemptId = id();
      const before = rating;
      let t = startedAt.getTime();
      const used = new Set<string>();
      for (let pos = 1; pos <= QUESTIONS_PER_ATTEMPT; pos++) {
        const pick = pickNext(rating, pool.filter((q) => !used.has(q.id)).map((q) => ({ id: q.id, rating: qs.get(q.id)!.rating, lastSeenAt: seen.get(q.id) ?? null })), rng);
        if (!pick) break;
        const q = qs.get(pick)!;
        used.add(pick);
        seen.set(pick, t);
        const correct = rng() < expected(l.ability, q.rating);
        const r = rate(rating, q.rating, correct, n, q.answerCount);
        const servedAt = new Date(t);
        t += 20_000 + Math.floor(rng() * 60_000);
        plan.answers.push({
          attemptId, questionId: pick, position: pos, servedAt, answeredAt: new Date(t), isCorrect: correct,
          userRatingBefore: rating, userRatingAfter: r.user, questionRatingBefore: q.rating, questionRatingAfter: r.question,
        });
        rating = r.user;
        n++;
        q.rating = r.question;
        q.answerCount++;
        if (correct) q.correctCount++;
      }
      plan.attempts.push({ id: attemptId, userId: l.userId, topicId: l.topicId, startedAt, finishedAt: new Date(t), ratingBefore: before, ratingAfter: rating });
      lastStartedAt = startedAt;
    }
    if (input.now.getTime() - lastStartedAt.getTime() <= COOLDOWN_MS) throw new Error('Lượt cuối còn trong thời gian chờ');
    plan.skills.push({ userId: l.userId, topicId: l.topicId, rating, answerCount: n, lastStartedAt });
  }
  return plan;
}

export async function writeSkillHistory(prisma: PrismaClient, plan: SkillPlan) {
  await prisma.$transaction(async (tx) => {
    await tx.skillAttempt.createMany({ data: plan.attempts.map((a) => ({ ...a, status: 'submitted' as const })) });
    await tx.skillAnswer.createMany({
      data: plan.answers.map((a) => ({ ...a, selectedOptionIds: [], skipped: false })),
    });
    await tx.userTopicSkill.createMany({ data: plan.skills });
    // 1 câu UPDATE … FROM (VALUES …) thay vì ~200 update lẻ (DB dev ~1–2 s/query).
    const rows = [...plan.questions.values()].filter((q) => q.answerCount > 0);
    if (rows.length) {
      const values = rows.map((q) => `('${q.id}'::uuid, ${q.rating}, ${q.answerCount}, ${q.correctCount})`).join(',');
      await tx.$executeRawUnsafe(
        `UPDATE skill_questions s SET rating = v.r, "answerCount" = v.n, "correctCount" = v.c
           FROM (VALUES ${values}) AS v(id, r, n, c) WHERE s.id = v.id`,
      );
    }
  }, { timeout: 120_000, maxWait: 10_000 });
}
