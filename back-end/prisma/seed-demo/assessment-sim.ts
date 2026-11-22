// Mô phỏng câu trả lời quiz và bài nộp code cho dữ liệu demo. Thuần (rng có seed, id do nơi gọi cấp) → test được.
// Quiz: IRT 2 tham số — P(biết) = 1 / (1 + e^(−a(θ − b))). Biết → chọn phương án đúng THẬT; không biết → chọn theo độ hút.
// Chấm theo key trong DB như app, nên câu bị đặt sai key tự sinh độ phân biệt âm — đúng thứ dashboard phải bắt được.
import { addMs, weighted, type Rng } from './rng.ts';

export type SimQuestion = { id: string; type: 'single_choice' | 'multiple_choice'; points: number; options: { id: string; isCorrect: boolean }[] };
export type SimQuiz = { id: string; passScorePct: number; questions: SimQuestion[] };
// truth: chỉ số phương án đúng THẬT khi key trong DB bị đặt sai; weights: độ hút từng phương án khi học viên không biết.
export type ItemParam = { a: number; b: number; truth?: number[]; weights?: number[] };
export type SimAnswer = { questionId: string; selectedOptionIds: string[]; isCorrect: boolean; pointsAwarded: number; answeredAt: Date };
export type SimAttempt = {
  id: string;
  quizId: string;
  userId: string;
  attemptNo: number;
  startedAt: Date;
  submittedAt: Date;
  scorePct: number;
  passed: boolean;
  timeSpentSec: number;
  questionIds: string[];
  passScorePct: number;
  answers: SimAnswer[];
};
export type QuizRun = { maxAttempts: number; retake: number; mustPass?: boolean };

export type SimTest = { id: string; position: number; points: number };
export type SimExercise = { id: string; language: string; starter: string; solution: string; tests: SimTest[] };
// failing: vị trí test rớt ('all' = mọi test, 'some' = tập con ngẫu nhiên); mutate: sửa lời giải mẫu thành mã nguồn có lỗi.
export type SimBug = {
  kind: string;
  weight: number;
  failing: number[] | 'all' | 'some';
  status: 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded';
  mutate?: [string, string][];
};
export type SimResult = { testCaseId: string; status: string; timeMs: number | null; memoryKb: number | null; stderrExcerpt: string | null; receivedAt: Date };
export type SimSubmission = {
  id: string;
  exerciseId: string;
  userId: string;
  language: string;
  sourceCode: string;
  status: string;
  score: number;
  passedTests: number;
  totalTests: number;
  maxTimeMs: number | null;
  maxMemoryKb: number | null;
  submittedAt: Date;
  gradedAt: Date;
  results: SimResult[];
};
export type CodeRun = { maxSubmissions: number; mustPass?: boolean; mustFail?: boolean; giveUp?: number };

export const GENERIC_BUGS: SimBug[] = [
  { kind: 'wrong', weight: 70, failing: 'some', status: 'wrong_answer' },
  { kind: 'runtime', weight: 20, failing: 'all', status: 'runtime_error' },
  { kind: 'tle', weight: 10, failing: 'all', status: 'time_limit_exceeded' },
];
const RUNTIME_STDERR = "TypeError: Cannot read properties of undefined (reading 'trim')";

export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
export function gaussian(rng: Rng) {
  const u = 1 - rng(); // (0, 1]: tránh log(0)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}
// Câu không cài sẵn: độ khó rải theo vị trí câu, không tốn thêm số ngẫu nhiên.
export const defaultParam = (i: number): ItemParam => ({ a: 1.2, b: -0.6 + (i % 5) * 0.3 });

// Năng lực θ cố định theo học viên (cùng người học nhiều khoá vẫn một θ).
export function thetaBank(rng: Rng, mean = 0.3, sd = 0.8) {
  const bank = new Map<string, number>();
  return (userId: string) => {
    let v = bank.get(userId);
    if (v === undefined) bank.set(userId, (v = mean + sd * gaussian(rng)));
    return v;
  };
}

export function chooseOptions(rng: Rng, q: SimQuestion, p: ItemParam, theta: number): string[] {
  const keyed = q.options.flatMap((o, i) => (o.isCorrect ? [i] : []));
  const truth = p.truth ?? keyed;
  if (rng() < sigmoid(p.a * (theta - p.b))) return truth.map((i) => q.options[i].id);
  const w = p.weights ?? q.options.map(() => 1);
  if (q.type === 'single_choice') return [q.options[weighted(rng, w.map((x, i) => [i, x] as const))].id];
  // Nhiều đáp án, không biết: mỗi phương án chọn theo độ hút; bỏ tập rỗng và tập trùng khít đáp án đúng thật.
  for (;;) {
    const picked = q.options.flatMap((_, i) => (rng() < w[i] / (1 + w[i]) ? [i] : []));
    const same = picked.length === truth.length && picked.every((i) => truth.includes(i));
    if (picked.length && !same) return picked.map((i) => q.options[i].id);
  }
}

// Như app: đúng khi tập chọn trùng khít tập đáp án đúng.
export function gradeAnswer(q: SimQuestion, selected: string[]) {
  const key = q.options.filter((o) => o.isCorrect).map((o) => o.id);
  const ok = selected.length === key.length && key.every((id) => selected.includes(id));
  return { isCorrect: ok, pointsAwarded: ok ? q.points : 0 };
}

// Các lượt rải đều trong (from, to]; lượt sau năng lực nhích lên (đã xem lại bài). mustPass: lượt cuối chắc chắn đạt.
export function simulateQuiz(
  rng: Rng,
  a: { quiz: SimQuiz; param: (i: number) => ItemParam; userId: string; theta: number; from: Date; to: Date; run: QuizRun; id: () => string },
) {
  const attempts: SimAttempt[] = [];
  const step = (a.to.getTime() - a.from.getTime()) / a.run.maxAttempts;
  const total = a.quiz.questions.reduce((s, q) => s + q.points, 0);
  for (let k = 1; k <= a.run.maxAttempts; k++) {
    const last = k === a.run.maxAttempts;
    // mustPass: lượt cuối trả lời theo hiểu biết đầy đủ (θ = ∞) → chắc chắn đạt, trừ câu bị đặt sai key.
    const theta = a.run.mustPass && last ? Number.POSITIVE_INFINITY : a.theta + 0.35 * (k - 1);
    const submittedAt = new Date(a.from.getTime() + step * k);
    const spent = 120 + Math.floor(rng() * 600);
    const answers = a.quiz.questions.map((q, i) => {
      const selected = chooseOptions(rng, q, a.param(i), theta);
      return { questionId: q.id, selectedOptionIds: selected, ...gradeAnswer(q, selected), answeredAt: submittedAt };
    });
    const scorePct = Math.round((10_000 * answers.reduce((s, x) => s + x.pointsAwarded, 0)) / total) / 100;
    const passed = scorePct >= a.quiz.passScorePct;
    attempts.push({
      id: a.id(),
      quizId: a.quiz.id,
      userId: a.userId,
      attemptNo: k,
      startedAt: addMs(submittedAt, -spent * 1000),
      submittedAt,
      scorePct,
      passed,
      timeSpentSec: spent,
      questionIds: a.quiz.questions.map((q) => q.id),
      passScorePct: a.quiz.passScorePct,
      answers,
    });
    if (passed) return { attempts, passedAt: submittedAt };
    if (last || (!a.run.mustPass && rng() >= a.run.retake)) break;
  }
  return { attempts, passedAt: null as Date | null };
}

export function simulateExercise(
  rng: Rng,
  a: { exercise: SimExercise; bugs: SimBug[]; b: number; userId: string; theta: number; from: Date; to: Date; run: CodeRun; id: () => string },
) {
  const subs: SimSubmission[] = [];
  const step = (a.to.getTime() - a.from.getTime()) / a.run.maxSubmissions;
  const total = a.exercise.tests.reduce((s, t) => s + t.points, 0);
  for (let k = 1; k <= a.run.maxSubmissions; k++) {
    const last = k === a.run.maxSubmissions;
    const submittedAt = new Date(a.from.getTime() + step * k);
    const accept = !a.run.mustFail && ((!!a.run.mustPass && last) || rng() < sigmoid(1.3 * (a.theta + 0.45 * (k - 1) - a.b)));
    const bug = accept ? null : weighted(rng, a.bugs.map((x) => [x, x.weight] as const));
    const positions = a.exercise.tests.map((t) => t.position);
    const failing = new Set(!bug ? [] : bug.failing === 'all' ? positions : bug.failing === 'some' ? someOf(rng, positions) : bug.failing);
    const results = a.exercise.tests.map((t) => {
      const status = failing.has(t.position) ? bug!.status : 'accepted';
      return {
        testCaseId: t.id,
        status,
        timeMs: status === 'time_limit_exceeded' ? null : 18 + Math.floor(rng() * 70),
        memoryKb: 38_000 + Math.floor(rng() * 8_000),
        stderrExcerpt: status === 'runtime_error' ? RUNTIME_STDERR : null,
        receivedAt: addMs(submittedAt, 4_000),
      };
    });
    const passedPts = a.exercise.tests.filter((t) => !failing.has(t.position)).reduce((s, t) => s + t.points, 0);
    const times = results.flatMap((r) => (r.timeMs === null ? [] : [r.timeMs]));
    subs.push({
      id: a.id(),
      exerciseId: a.exercise.id,
      userId: a.userId,
      language: a.exercise.language,
      sourceCode: !bug ? a.exercise.solution : bug.mutate ? bug.mutate.reduce((src, [x, y]) => src.replace(x, y), a.exercise.solution) : a.exercise.starter,
      status: bug ? bug.status : 'accepted',
      score: Math.round((100 * passedPts) / total),
      passedTests: a.exercise.tests.length - failing.size,
      totalTests: a.exercise.tests.length,
      maxTimeMs: times.length ? Math.max(...times) : null,
      maxMemoryKb: Math.max(...results.map((r) => r.memoryKb)),
      submittedAt,
      gradedAt: addMs(submittedAt, 5_000),
      results,
    });
    if (accept) return { submissions: subs, acceptedAt: submittedAt as Date | null };
    if (last || (!a.run.mustPass && !a.run.mustFail && a.run.giveUp !== undefined && rng() < a.run.giveUp)) break;
  }
  return { submissions: subs, acceptedAt: null as Date | null };
}

// Tập con khác rỗng và khác toàn bộ (lỗi sai một phần test).
function someOf(rng: Rng, xs: number[]) {
  if (xs.length < 2) return xs;
  for (;;) {
    const s = xs.filter(() => rng() < 0.5);
    if (s.length && s.length < xs.length) return s;
  }
}
