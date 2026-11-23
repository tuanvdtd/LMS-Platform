// Phân tích câu hỏi quiz (item analysis cổ điển) + tổng hợp lượt làm. Hàm thuần, KHÔNG import gì: seed-demo
// (node --experimental-strip-types) dùng lại trong test kiểm chứng.
// Ngưỡng: độ phân biệt theo Ebel (1972); độ khó theo hướng dẫn item analysis (UW, BYU); đáp án nhiễu "chết" khi < 5%
// người chọn (Tarrant, Ware & Mohammed 2009); nhóm cao/thấp 27% (Kelley 1939). Lớp nhỏ / quiz ngắn thì D dao động mạnh
// (sai số chuẩn ~0.2 với ~50 lượt) → cờ theo D chỉ bật khi D + 1 sai số chuẩn vẫn dưới ngưỡng, tránh báo động giả.

export const ITEM_MIN_N = 30; // dưới ngưỡng: vẫn trả số, không gắn cờ
export const GROUP_FRACTION = 0.27;
export const D_LOW = 0.2;
export const P_EASY = 0.9;
export const P_HARD = 0.3;
export const DISTRACTOR_DEAD = 0.05;

export type FlagCode = 'negative_d' | 'low_d' | 'too_easy' | 'too_hard' | 'dead_distractor' | 'attractive_distractor';
export type ItemStatus = 'good' | 'review' | 'fix' | 'insufficient';
export type Flag = { code: FlagCode; optionId?: string };
export type ItemQuestion = { id: string; type: 'single_choice' | 'multiple_choice'; options: { id: string; isCorrect: boolean }[] };
export type ItemAnswer = { questionId: string; selectedOptionIds: string[]; isCorrect: boolean; pointsAwarded: number };
export type ItemStat = {
  id: string;
  n: number;
  p: number | null;
  d: number | null;
  dSe: number | null; // sai số chuẩn của D
  pUpper: number | null;
  pLower: number | null;
  options: { id: string; pickedCount: number; pickedRate: number }[];
  status: ItemStatus;
  flags: Flag[];
};
export type AttemptRow = { userId: string; attemptNo: number; scorePct: number; passed: boolean };
export type QuizSummary = {
  n: number;
  meanPct: number | null;
  medianPct: number | null;
  passRateFirstPct: number | null;
  passRateFinalPct: number | null;
  avgAttemptsToPass: number | null;
  histogram: { fromPct: number; toPct: number; count: number }[];
};

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// attempts: đáp án của từng lượt; nơi gọi chỉ đưa lượt nộp sớm nhất của mỗi học viên (lượt sau đã biết câu nào sai).
export function analyzeItems(questions: ItemQuestion[], attempts: ItemAnswer[][]): ItemStat[] {
  const totals = attempts.map((answers) => answers.reduce((s, a) => s + a.pointsAwarded, 0));
  return questions.map((q) => {
    const rows: { correct: number; rest: number; selected: string[] }[] = [];
    attempts.forEach((answers, i) => {
      const a = answers.find((x) => x.questionId === q.id);
      if (a) rows.push({ correct: a.isCorrect ? 1 : 0, rest: totals[i] - a.pointsAwarded, selected: a.selectedOptionIds });
    });
    const n = rows.length;
    const options = q.options.map((o) => {
      const pickedCount = rows.filter((r) => r.selected.includes(o.id)).length;
      return { id: o.id, pickedCount, pickedRate: n ? pickedCount / n : 0 };
    });
    if (!n) return { id: q.id, n, p: null, d: null, dSe: null, pUpper: null, pLower: null, options, status: 'insufficient', flags: [] };
    const p = mean(rows.map((r) => r.correct));
    const { d, se, pUpper, pLower } = discrimination(rows);
    const flags = n >= ITEM_MIN_N ? flagsOf(q, p, d, se, options) : [];
    const status: ItemStatus =
      n < ITEM_MIN_N ? 'insufficient' : flags.some((f) => f.code === 'negative_d') ? 'fix' : flags.length ? 'review' : 'good';
    return { id: q.id, n, p, d, dSe: se, pUpper, pLower, options, status, flags };
  });
}

// Xếp theo điểm các câu CÒN LẠI (quiz ngắn: để câu đang xét trong tổng điểm sẽ tự kéo D lên).
// Người bằng điểm ở ranh giới vào cùng nhóm, không cắt ngẫu nhiên. Hai nhóm chồng nhau → không tính được.
// se: sai số chuẩn của hiệu hai tỉ lệ độc lập (nhóm cao, nhóm thấp).
export function discrimination(rows: { correct: number; rest: number }[]) {
  const none = { d: null, se: null, pUpper: null, pLower: null };
  if (rows.length < 2) return none;
  const k = Math.ceil(GROUP_FRACTION * rows.length);
  const desc = rows.map((r) => r.rest).sort((a, b) => b - a);
  const hiCut = desc[k - 1];
  const loCut = desc[rows.length - k];
  if (loCut >= hiCut) return none;
  const upper = rows.filter((r) => r.rest >= hiCut).map((r) => r.correct);
  const lower = rows.filter((r) => r.rest <= loCut).map((r) => r.correct);
  const pUpper = mean(upper);
  const pLower = mean(lower);
  const se = Math.sqrt((pUpper * (1 - pUpper)) / upper.length + (pLower * (1 - pLower)) / lower.length);
  return { d: pUpper - pLower, se, pUpper, pLower };
}

function flagsOf(q: ItemQuestion, p: number, d: number | null, se: number | null, options: ItemStat['options']): Flag[] {
  const flags: Flag[] = [];
  // Cờ theo D chỉ khi chênh lệch vượt mức nhiễu do cỡ mẫu: D + 1 sai số chuẩn vẫn dưới ngưỡng.
  const upperD = d === null || se === null ? null : d + se;
  if (upperD !== null && upperD < 0) flags.push({ code: 'negative_d' });
  else if (upperD !== null && upperD < D_LOW) flags.push({ code: 'low_d' });
  if (p > P_EASY) flags.push({ code: 'too_easy' });
  if (p < P_HARD) flags.push({ code: 'too_hard' });
  const correctPicks = Math.max(0, ...q.options.flatMap((o, i) => (o.isCorrect ? [options[i].pickedCount] : [])));
  q.options.forEach((o, i) => {
    if (o.isCorrect) return;
    if (options[i].pickedRate < DISTRACTOR_DEAD) flags.push({ code: 'dead_distractor', optionId: o.id });
    if (q.type === 'single_choice' && options[i].pickedCount > correctPicks) flags.push({ code: 'attractive_distractor', optionId: o.id });
  });
  return flags;
}

// Lượt nộp sớm nhất (attemptNo nhỏ nhất) của mỗi học viên.
export function firstAttempts<T extends { userId: string; attemptNo: number }>(attempts: T[]): T[] {
  const first = new Map<string, T>();
  for (const a of attempts) {
    const cur = first.get(a.userId);
    if (!cur || a.attemptNo < cur.attemptNo) first.set(a.userId, a);
  }
  return [...first.values()];
}

// attempts: mọi lượt ĐÃ NỘP của một quiz.
export function summarizeAttempts(attempts: AttemptRow[]): QuizSummary {
  const byUser = new Map<string, AttemptRow[]>();
  for (const a of [...attempts].sort((x, y) => x.attemptNo - y.attemptNo)) {
    const list = byUser.get(a.userId);
    if (list) list.push(a);
    else byUser.set(a.userId, [a]);
  }
  const lists = [...byUser.values()];
  const firsts = lists.map((l) => l[0]);
  const toPass = lists.flatMap((l) => {
    const i = l.findIndex((a) => a.passed);
    return i < 0 ? [] : [i + 1];
  });
  const n = firsts.length;
  const pct = (k: number) => (n ? (100 * k) / n : null);
  const histogram = Array.from({ length: 10 }, (_, i) => ({ fromPct: i * 10, toPct: i * 10 + 10, count: 0 }));
  for (const f of firsts) histogram[Math.min(9, Math.floor(f.scorePct / 10))].count++;
  return {
    n,
    meanPct: n ? mean(firsts.map((f) => f.scorePct)) : null,
    medianPct: median(firsts.map((f) => f.scorePct)),
    passRateFirstPct: pct(firsts.filter((f) => f.passed).length),
    passRateFinalPct: pct(toPass.length),
    avgAttemptsToPass: toPass.length ? mean(toPass) : null,
    histogram,
  };
}
