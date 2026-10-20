import type { SubmissionStatus } from '@prisma/client';
import type { Language, Limits } from './code-runner.js';

// Chấm bài code (spec coding-exercise §4). Hàm thuần, không I/O — runner truyền vào.
export type RunResult = {
  verdict: 'ok' | 'compile_error' | 'runtime_error' | 'time_limit_exceeded';
  stdout: string;
  stderr: string;
  compileOutput: string | null;
  timeMs: number | null;
  memoryKb: number | null;
};
export type RunFn = (language: Language, code: string, stdin: string, limits: Limits) => Promise<RunResult>;
export type TestRun = { testCaseId: string; status: SubmissionStatus; run: RunResult };

const EXCERPT = 2048;
// Postgres text không nhận 0x00 → bỏ NUL trước khi cắt.
export const excerpt = (raw: string) => {
  const s = raw.replaceAll('\u0000', '');
  return s.length > EXCERPT ? `${s.slice(0, EXCERPT)}…` : s;
};

export const normalize = (s: string) =>
  s.replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).join('\n').trimEnd();

export function judge(run: RunResult, expectedOutput: string): SubmissionStatus {
  if (run.verdict !== 'ok') return run.verdict;
  return normalize(run.stdout) === normalize(expectedOutput) ? 'accepted' : 'wrong_answer';
}

// ponytail: tuần tự + Piston compile lại mỗi test (C++ 20 test ≈ 20 giây). Nâng cấp: chạy song song vài test,
// hoặc compile một lần chạy nhiều input.
export async function runTests(
  run: RunFn,
  language: Language,
  code: string,
  tests: { id: string; input: string; expectedOutput: string }[],
  limits: Limits,
): Promise<{ compileError: string | null; results: TestRun[] }> {
  const results: TestRun[] = [];
  for (const t of tests) {
    const r = await run(language, code, t.input, limits);
    if (r.verdict === 'compile_error') return { compileError: r.compileOutput ?? '', results: [] };
    results.push({ testCaseId: t.id, status: judge(r, t.expectedOutput), run: r });
  }
  return { compileError: null, results };
}

const maxOf = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x !== null);
  return v.length ? Math.max(...v) : null;
};

// E11: điểm = % điểm test đạt; trạng thái = test sai đầu tiên theo position (kiểu LeetCode).
export function summarize(tests: { id: string; position: number; points: number }[], results: TestRun[]) {
  if (!tests.length) {
    return { status: 'internal_error' as SubmissionStatus, score: 0, passedTests: 0, maxTimeMs: null, maxMemoryKb: null };
  }
  const byId = new Map(results.map((r) => [r.testCaseId, r]));
  const sorted = [...tests].sort((a, b) => a.position - b.position);
  const total = sorted.reduce((s, t) => s + t.points, 0);
  let passed = 0;
  let passedPoints = 0;
  let firstFail: SubmissionStatus | null = null;
  for (const t of sorted) {
    const status = byId.get(t.id)?.status ?? 'internal_error';
    if (status === 'accepted') {
      passed++;
      passedPoints += t.points;
    } else firstFail ??= status;
  }
  return {
    status: firstFail ?? ('accepted' as SubmissionStatus),
    score: Math.round((100 * passedPoints) / total),
    passedTests: passed,
    maxTimeMs: maxOf(results.map((r) => r.run.timeMs)),
    maxMemoryKb: maxOf(results.map((r) => r.run.memoryKb)),
  };
}

const STATUS_TEXT: Partial<Record<SubmissionStatus, string>> = {
  accepted: 'Accepted',
  wrong_answer: 'Wrong Answer',
  time_limit_exceeded: 'Time Limit Exceeded',
  runtime_error: 'Runtime Error',
  compile_error: 'Lỗi biên dịch',
  internal_error: 'Lỗi hệ thống, hãy nộp lại',
};

export function notificationBody(title: string, status: SubmissionStatus, passedTests: number, totalTests: number) {
  const text = STATUS_TEXT[status] ?? status;
  return status === 'compile_error' || status === 'internal_error'
    ? `Bài "${title}": ${text}`
    : `Bài "${title}": ${text} ${passedTests}/${totalTests} test`;
}
