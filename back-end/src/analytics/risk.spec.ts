import { assessRisk, bandOf, type RiskInput } from './risk.js';

const DAY = 86_400_000;
const now = new Date('2026-11-21T12:00:00Z');
const ago = (d: number) => new Date(now.getTime() - d * DAY);
const st = (userId: string, o: Partial<RiskInput> = {}): RiskInput => ({
  userId,
  enrolledAt: ago(20),
  progressPct: 50,
  lastAccessedAt: ago(1),
  completedAt: null,
  quizzes: [],
  ...o,
});
// 5 bạn cùng lứa (ghi danh 20 ngày) tiến độ 80% → trung vị 80.
const peers = ['p1', 'p2', 'p3', 'p4', 'p5'].map((id) => st(id, { progressPct: 80 }));
const risk = (s: RiskInput, others = peers) => assessRisk(now, [...others, s]).get(s.userId)!;

describe('bandOf', () => {
  it('nhóm tuổi ghi danh', () => {
    expect([6, 7, 13, 14, 29, 30, 60, 119, 120, 400].map(bandOf)).toEqual([
      null, '7–14', '7–14', '14–30', '14–30', '30–60', '60–120', '60–120', '120+', '120+',
    ]);
  });
});

describe('assessRisk', () => {
  it('đã hoàn thành → done; ghi danh < 7 ngày → new; không có lý do', () => {
    expect(risk(st('a', { completedAt: ago(2), lastAccessedAt: ago(40) }))).toMatchObject({ level: 'done', reasons: [] });
    expect(risk(st('b', { enrolledAt: ago(3), lastAccessedAt: null }))).toMatchObject({ level: 'new', reasons: [] });
  });
  it('≥ 30 ngày chưa vào học → high dù tiến độ ngang lớp', () => {
    expect(risk(st('c', { progressPct: 80, lastAccessedAt: ago(31) }))).toMatchObject({
      level: 'high',
      inactiveDays: 31,
      reasons: [{ code: 'inactive', days: 31 }],
    });
  });
  it('chưa từng vào học thì tính từ ngày ghi danh', () => {
    expect(risk(st('d', { lastAccessedAt: null, progressPct: 0 })).inactiveDays).toBe(20);
  });
  it('≥ 14 ngày + chậm hơn bạn cùng lứa ≥ 20 điểm → high, lý do nêu trung vị nhóm', () => {
    const r = risk(st('e', { progressPct: 30, lastAccessedAt: ago(15) }));
    expect(r).toMatchObject({ level: 'high', lagPts: 50, peerMedianPct: 80, band: '14–30' });
    expect(r.reasons).toEqual([
      { code: 'inactive', days: 15 },
      { code: 'lagging', lagPts: 50, peerMedianPct: 80, band: '14–30' },
    ]);
  });
  it('≥ 14 ngày nhưng không chậm, không yếu quiz → watch', () => {
    expect(risk(st('f', { progressPct: 85, lastAccessedAt: ago(15) })).level).toBe('watch');
  });
  it('đang học đều nhưng chậm, hoặc quiz lượt đầu dưới điểm đạt → watch', () => {
    expect(risk(st('g', { progressPct: 40 })).reasons).toEqual([{ code: 'lagging', lagPts: 40, peerMedianPct: 80, band: '14–30' }]);
    const q = risk(st('h', { progressPct: 85, quizzes: [{ scorePct: 50, passScorePct: 70 }, { scorePct: 60, passScorePct: 70 }] }));
    expect(q).toMatchObject({ level: 'watch', avgFirstPct: 55, quizGapPts: 15, reasons: [{ code: 'low_quiz', avgFirstPct: 55, gapPts: 15 }] });
  });
  it('ổn: hoạt động gần đây, ngang lớp, quiz đạt', () => {
    expect(risk(st('i', { progressPct: 85, quizzes: [{ scorePct: 90, passScorePct: 70 }] }))).toMatchObject({ level: 'ok', reasons: [] });
  });
  it('bạn cùng lứa < 5 người (không tính chính mình) → không xét chậm', () => {
    expect(risk(st('j', { progressPct: 0 }), peers.slice(0, 4))).toMatchObject({ lagPts: null, peerMedianPct: null, level: 'ok' });
  });
});
