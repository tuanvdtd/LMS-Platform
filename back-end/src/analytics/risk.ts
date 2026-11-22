// Mức nguy cơ bỏ học bằng LUẬT rõ ràng (không phải mô hình): mỗi mức nói được vì sao. Hàm thuần, KHÔNG import gì.
// Mốc 14 ngày vắng: nghiên cứu cảnh báo sớm ở MOOC (Stanford, arXiv:1710.03323) bắt thêm 40–45% người bỏ học trong
// 14 ngày vắng mặt. Khoá tự học → so tiến độ với bạn cùng lứa ghi danh, so cả lớp thì bất công với người mới vào.
export const RISK = { newDays: 7, watchInactive: 7, highInactive: 14, severeInactive: 30, lagPts: 20, peerMin: 5 } as const;
export const AGE_BANDS = [7, 14, 30, 60, 120] as const; // [7,14) [14,30) [30,60) [60,120) [120,∞) ngày

const DAY = 86_400_000;

export type RiskLevel = 'high' | 'watch' | 'ok' | 'new' | 'done';
export type RiskReason =
  | { code: 'inactive'; days: number }
  | { code: 'lagging'; lagPts: number; peerMedianPct: number; band: string }
  | { code: 'low_quiz'; avgFirstPct: number; gapPts: number };
export type RiskInput = {
  userId: string;
  enrolledAt: Date;
  progressPct: number;
  lastAccessedAt: Date | null;
  completedAt: Date | null;
  quizzes: { scorePct: number; passScorePct: number }[]; // lượt nộp sớm nhất của từng quiz
};
export type Risk = {
  level: RiskLevel;
  inactiveDays: number;
  lagPts: number | null;
  peerMedianPct: number | null;
  band: string | null;
  quizGapPts: number | null;
  avgFirstPct: number | null;
  reasons: RiskReason[];
};

const round1 = (x: number) => Math.round(x * 10) / 10;
const daysSince = (now: Date, d: Date) => Math.max(0, Math.floor((now.getTime() - d.getTime()) / DAY));
const medianOf = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function bandOf(ageDays: number): string | null {
  for (let i = AGE_BANDS.length - 1; i >= 0; i--) {
    if (ageDays >= AGE_BANDS[i]) return i === AGE_BANDS.length - 1 ? `${AGE_BANDS[i]}+` : `${AGE_BANDS[i]}–${AGE_BANDS[i + 1]}`;
  }
  return null; // < 7 ngày: mới ghi danh
}

export function assessRisk(now: Date, students: RiskInput[]): Map<string, Risk> {
  const bands = new Map(students.map((s) => [s.userId, bandOf(daysSince(now, s.enrolledAt))]));
  const out = new Map<string, Risk>();
  for (const s of students) {
    const band = bands.get(s.userId) ?? null;
    const inactiveDays = daysSince(now, s.lastAccessedAt ?? s.enrolledAt);
    const peers = band ? students.filter((o) => o.userId !== s.userId && bands.get(o.userId) === band).map((o) => o.progressPct) : [];
    const peerMedianPct = peers.length >= RISK.peerMin ? round1(medianOf(peers)) : null;
    const lagPts = peerMedianPct === null ? null : round1(peerMedianPct - s.progressPct);
    const n = s.quizzes.length;
    const avgFirstPct = n ? round1(s.quizzes.reduce((a, q) => a + q.scorePct, 0) / n) : null;
    const quizGapPts = n ? round1(s.quizzes.reduce((a, q) => a + q.passScorePct - q.scorePct, 0) / n) : null;
    const base = { inactiveDays, lagPts, peerMedianPct, band, quizGapPts, avgFirstPct };
    if (s.completedAt) {
      out.set(s.userId, { ...base, level: 'done', reasons: [] });
      continue;
    }
    if (!band) {
      out.set(s.userId, { ...base, level: 'new', reasons: [] });
      continue;
    }
    const lagging = lagPts !== null && lagPts >= RISK.lagPts;
    const lowQuiz = quizGapPts !== null && quizGapPts > 0;
    const reasons: RiskReason[] = [];
    if (inactiveDays >= RISK.watchInactive) reasons.push({ code: 'inactive', days: inactiveDays });
    if (lagging) reasons.push({ code: 'lagging', lagPts: lagPts!, peerMedianPct: peerMedianPct!, band });
    if (lowQuiz) reasons.push({ code: 'low_quiz', avgFirstPct: avgFirstPct!, gapPts: quizGapPts! });
    const high = inactiveDays >= RISK.severeInactive || (inactiveDays >= RISK.highInactive && (lagging || lowQuiz));
    out.set(s.userId, { ...base, level: high ? 'high' : reasons.length ? 'watch' : 'ok', reasons });
  }
  return out;
}
