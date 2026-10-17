// Chấm quiz (spec 2026-10-17-quiz-taking B5–B7, C1). Thuần, không đụng DB.
export type GradeQuestion = { id: string; type: 'single_choice' | 'multiple_choice'; points: number; options: { id: string; isCorrect: boolean }[] };
export type GradeAnswer = { questionId: string; optionIds: string[] };
export type GradedAnswer = { questionId: string; selectedOptionIds: string[]; isCorrect: boolean; pointsAwarded: number };

export function grade(questions: GradeQuestion[], answers: GradeAnswer[]) {
  const byQ = new Map(answers.map((a) => [a.questionId, a.optionIds]));
  let points = 0;
  let max = 0;
  let correctCount = 0;
  const graded = questions.map((q): GradedAnswer => {
    const valid = new Set(q.options.map((o) => o.id));
    const selected = [...new Set(byQ.get(q.id) ?? [])].filter((id) => valid.has(id));
    const correct = q.options.filter((o) => o.isCorrect).map((o) => o.id);
    const isCorrect =
      selected.length === correct.length &&
      correct.every((id) => selected.includes(id)) &&
      (q.type === 'multiple_choice' || selected.length === 1);
    max += q.points;
    if (isCorrect) { points += q.points; correctCount++; }
    return { questionId: q.id, selectedOptionIds: selected, isCorrect, pointsAwarded: isCorrect ? q.points : 0 };
  });
  const scorePct = max ? Math.round((points / max) * 10_000) / 100 : 0;
  return { answers: graded, correctCount, total: questions.length, scorePct };
}

// Fisher–Yates với PRNG mulberry32, seed băm FNV-1a từ chuỗi (attemptId) → resume/xem lại giữ nguyên thứ tự.
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const ema = (prev: { score: number; attemptsCount: number } | null, s: number) =>
  !prev || prev.attemptsCount === 0 ? s : 0.7 * prev.score + 0.3 * s;
