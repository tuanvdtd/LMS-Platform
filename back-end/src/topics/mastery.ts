import type { Prisma } from '@prisma/client';

// Mastery topic = trung bình điểm cao nhất của từng quiz (trọng số = số câu đang hoạt động) và từng bài code
// (trọng số 5), tính lại từ quiz_attempts + submissions (spec quiz-taking C1, coding-exercise E6) nên đổi công thức
// không mất dữ liệu. Advisory lock theo user: 2 lần nộp song song chạy nối tiếp, lần sau thấy lần trước đã commit.
export async function recomputeMastery(tx: Prisma.TransactionClient, userId: string, topicIds: string[]) {
  if (!topicIds.length) return;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`;
  await tx.$executeRaw`
    INSERT INTO user_topic_mastery ("userId", "topicId", score, "attemptsCount", "lastEvaluatedAt")
    SELECT ${userId}::uuid, b."topicId", SUM(b.best * b.w) / SUM(b.w) / 100, SUM(b.cnt), now()
    FROM (
      SELECT qt."topicId", MAX(a."scorePct")::numeric AS best, COUNT(*) AS cnt,
        GREATEST((SELECT COUNT(*) FROM questions q WHERE q."quizId" = a."quizId" AND q."archivedAt" IS NULL), 1) AS w
      FROM quiz_attempts a JOIN quiz_topics qt ON qt."quizId" = a."quizId"
      WHERE a."userId" = ${userId}::uuid AND a.status = 'submitted'
      GROUP BY qt."topicId", a."quizId"
      UNION ALL
      SELECT et."topicId", MAX(s.score)::numeric AS best, COUNT(*) AS cnt, 5::bigint AS w
      FROM submissions s JOIN exercise_topics et ON et."exerciseId" = s."exerciseId"
      WHERE s."userId" = ${userId}::uuid AND s.status NOT IN ('pending', 'running', 'internal_error')
      GROUP BY et."topicId", s."exerciseId"
    ) b
    WHERE b."topicId" = ANY(${topicIds}::uuid[])
    GROUP BY b."topicId"
    ON CONFLICT ("userId", "topicId") DO UPDATE SET
      score = EXCLUDED.score, "attemptsCount" = EXCLUDED."attemptsCount", "lastEvaluatedAt" = EXCLUDED."lastEvaluatedAt"`;
}
