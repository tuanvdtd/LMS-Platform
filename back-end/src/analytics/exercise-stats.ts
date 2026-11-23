// Thống kê bài code từ bài nộp ĐÃ CHẤM. Hàm thuần, KHÔNG import gì (seed-demo dùng lại).
export const STUCK_SUBMISSIONS = 3; // nộp từ 3 lần vẫn chưa Accepted = đang mắc kẹt
export const VERDICTS = ['accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compile_error'] as const;
export type Verdict = (typeof VERDICTS)[number];
const isVerdict = (s: string): s is Verdict => (VERDICTS as readonly string[]).includes(s);

export type StatTest = { id: string; position: number; isPublic: boolean };
export type StatSubmission = { userId: string; status: string; submittedAt: Date; results: { testCaseId: string; status: string }[] };

export function exerciseStats(tests: StatTest[], submissions: StatSubmission[]) {
  // pending / running / internal_error chưa phải kết quả của học viên → bỏ.
  const graded = submissions.filter((s) => isVerdict(s.status)).sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());
  const byUser = new Map<string, StatSubmission[]>();
  for (const s of graded) {
    const list = byUser.get(s.userId);
    if (list) list.push(s);
    else byUser.set(s.userId, [s]);
  }
  const toPass: number[] = [];
  let stuck = 0;
  for (const list of byUser.values()) {
    const i = list.findIndex((s) => s.status === 'accepted');
    if (i >= 0) toPass.push(i + 1);
    else if (list.length >= STUCK_SUBMISSIONS) stuck++;
  }
  const verdicts = Object.fromEntries(VERDICTS.map((v) => [v, graded.filter((s) => s.status === v).length])) as Record<Verdict, number>;
  const learners = byUser.size;
  return {
    learners,
    passed: toPass.length,
    passRatePct: learners ? (100 * toPass.length) / learners : null,
    avgSubmissionsToPass: toPass.length ? toPass.reduce((s, x) => s + x, 0) / toPass.length : null,
    stuck,
    submissions: graded.length,
    verdicts,
    tests: [...tests]
      .sort((a, b) => a.position - b.position)
      .map((t) => {
        const results = graded.flatMap((s) => s.results.filter((r) => r.testCaseId === t.id && isVerdict(r.status)));
        const failed = results.filter((r) => r.status !== 'accepted').length;
        return {
          id: t.id,
          position: t.position,
          isPublic: t.isPublic,
          graded: results.length,
          failed,
          failRatePct: results.length ? (100 * failed) / results.length : null,
        };
      }),
  };
}
