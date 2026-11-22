import { analyzeItems, discrimination, firstAttempts, summarizeAttempts, type ItemAnswer, type ItemQuestion } from './item-analysis.js';

const single: ItemQuestion = {
  id: 'q',
  type: 'single_choice',
  options: [
    { id: 'A', isCorrect: true },
    { id: 'B', isCorrect: false },
    { id: 'C', isCorrect: false },
    { id: 'D', isCorrect: false },
  ],
};
// Một lượt = câu đang xét + câu "z" mang điểm các câu còn lại.
const att = (picked: string, rest: number): ItemAnswer[] => [
  { questionId: 'q', selectedOptionIds: [picked], isCorrect: picked === 'A', pointsAwarded: picked === 'A' ? 1 : 0 },
  { questionId: 'z', selectedOptionIds: [], isCorrect: true, pointsAwarded: rest },
];
const many = (n: number, f: (i: number) => ItemAnswer[]) => Array.from({ length: n }, (_, i) => f(i));
const codes = (s: { flags: { code: string; optionId?: string }[] }) =>
  s.flags.map((f) => (f.optionId ? `${f.code}:${f.optionId}` : f.code));

describe('discrimination', () => {
  it('nhóm 27% xếp theo điểm còn lại, người bằng điểm ở ranh giới vào cùng nhóm', () => {
    const rows = [[9, 1], [8, 1], [8, 0], [8, 1], [6, 1], [5, 0], [4, 1], [2, 0], [2, 0], [1, 1]].map(([rest, correct]) => ({
      rest,
      correct,
    }));
    const r = discrimination(rows);
    expect(r.pUpper).toBeCloseTo(0.75); // điểm còn lại ≥ 8: 4 người, đúng 3
    expect(r.pLower).toBeCloseTo(1 / 3); // ≤ 2: 3 người, đúng 1
    expect(r.d).toBeCloseTo(0.75 - 1 / 3);
    expect(r.se).toBeCloseTo(Math.sqrt((0.75 * 0.25) / 4 + (1 / 3) * (2 / 3) / 3));
  });
  it('điểm không phân tán (hai nhóm chồng nhau) hoặc quá ít lượt → null', () => {
    expect(discrimination([3, 3, 3, 3].map((rest) => ({ rest, correct: 1 }))).d).toBeNull();
    expect(discrimination([{ rest: 1, correct: 1 }]).d).toBeNull();
  });
});

describe('analyzeItems', () => {
  it('dưới 30 lượt: vẫn tính p và phân bố, không gắn cờ', () => {
    const [s] = analyzeItems([single], many(10, (i) => att(i < 3 ? 'A' : 'B', i)));
    expect(s.n).toBe(10);
    expect(s.p).toBeCloseTo(0.3);
    expect(s.options.find((o) => o.id === 'B')!.pickedCount).toBe(7);
    expect(s.status).toBe('insufficient');
    expect(s.flags).toEqual([]);
  });
  it('nhóm giỏi sai, nhóm yếu đúng → D âm, Cần sửa; phương án không ai chọn → đáp án nhiễu chết', () => {
    const [s] = analyzeItems([single], many(40, (i) => att(i % 10 < 5 ? 'A' : 'B', i % 10)));
    expect(s.d).toBeCloseTo(-1);
    expect(s.status).toBe('fix');
    expect(codes(s)).toEqual(['negative_d', 'dead_distractor:C', 'dead_distractor:D']);
  });
  it('ai cũng đúng → quá dễ + phân biệt kém, trạng thái Nên xem', () => {
    const [s] = analyzeItems([single], many(40, (i) => att('A', i % 10)));
    expect(s.p).toBe(1);
    expect(codes(s)).toEqual(['low_d', 'too_easy', 'dead_distractor:B', 'dead_distractor:C', 'dead_distractor:D']);
    expect(s.status).toBe('review');
  });
  it('phương án sai được chọn nhiều hơn đáp án đúng (câu 1 đáp án) → hút; câu nhiều đáp án không xét', () => {
    // 12 người chọn A với điểm còn lại cao, 22 chọn B, 6 chọn C.
    const rows = many(40, (i) => (i < 12 ? att('A', 9) : i < 34 ? att('B', i % 5) : att('C', 2)));
    const [s] = analyzeItems([single], rows);
    expect(s.p).toBeCloseTo(0.3);
    expect(codes(s)).toEqual(['attractive_distractor:B', 'dead_distractor:D']);
    const [m] = analyzeItems([{ ...single, type: 'multiple_choice' }], rows);
    expect(codes(m)).toEqual(['dead_distractor:D']);
  });
  it('D thấp nhưng còn nằm trong sai số do cỡ mẫu → không gắn "phân biệt kém"', () => {
    const upper = [7, 8, 9, 17, 18, 19, 27, 28, 29, 37, 38, 39]; // điểm còn lại 7–9
    const lower = [0, 1, 2, 10, 11, 12, 20, 21, 22, 30, 31, 32]; // điểm còn lại 0–2
    const right = new Set([...upper.slice(0, 7), ...lower.slice(0, 6), 3, 4, 5, 6, 13, 14, 15, 16]);
    const [s] = analyzeItems([single], many(40, (i) => att(right.has(i) ? 'A' : ['B', 'C', 'D'][i % 3], i % 10)));
    expect(s.d).toBeCloseTo(7 / 12 - 6 / 12);
    expect(s.d! + s.dSe!).toBeGreaterThan(0.2);
    expect(s).toMatchObject({ status: 'good', flags: [] });
  });
  it('câu chưa có lượt nào → null, Chưa đủ dữ liệu', () => {
    const [s] = analyzeItems([single], [[{ questionId: 'z', selectedOptionIds: [], isCorrect: true, pointsAwarded: 1 }]]);
    expect(s).toMatchObject({ n: 0, p: null, d: null, status: 'insufficient' });
  });
});

describe('summarizeAttempts', () => {
  it('lượt đầu cho điểm TB/trung vị/% đạt ngay; % đạt sau cùng và số lượt đến khi đạt', () => {
    const s = summarizeAttempts([
      { userId: 'u1', attemptNo: 2, scorePct: 80, passed: true },
      { userId: 'u1', attemptNo: 1, scorePct: 40, passed: false },
      { userId: 'u2', attemptNo: 1, scorePct: 100, passed: true },
      { userId: 'u3', attemptNo: 1, scorePct: 20, passed: false },
    ]);
    expect(s).toMatchObject({ n: 3, meanPct: 160 / 3, medianPct: 40, avgAttemptsToPass: 1.5 });
    expect(s.passRateFirstPct).toBeCloseTo(100 / 3);
    expect(s.passRateFinalPct).toBeCloseTo(200 / 3);
    expect(s.histogram.map((b) => b.count)).toEqual([0, 0, 1, 0, 1, 0, 0, 0, 0, 1]); // 100% vào khoảng cuối
  });
  it('chưa ai làm → số liệu null', () => {
    expect(summarizeAttempts([])).toMatchObject({ n: 0, meanPct: null, medianPct: null, passRateFirstPct: null, avgAttemptsToPass: null });
  });
  it('firstAttempts lấy attemptNo nhỏ nhất của mỗi người', () => {
    const f = firstAttempts([
      { userId: 'a', attemptNo: 2 },
      { userId: 'a', attemptNo: 1 },
      { userId: 'b', attemptNo: 3 },
    ]);
    expect(f).toEqual([
      { userId: 'a', attemptNo: 1 },
      { userId: 'b', attemptNo: 3 },
    ]);
  });
});
