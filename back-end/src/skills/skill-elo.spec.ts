import {
  DIFFICULTY_RATING, expected, isCorrectAnswer, kQuestion, kUser, masteryPct, pickNext, rate, REF_RATING, START_RATING,
} from './skill-elo.js';

describe('skill-elo', () => {
  it('expected: bằng nhau = 0.5, chênh 400 ≈ 0.909', () => {
    expect(expected(1200, 1200)).toBe(0.5);
    expect(expected(1600, 1200)).toBeCloseTo(0.909, 3);
    expect(expected(1200, 1600)).toBeCloseTo(0.091, 3);
  });

  it('masteryPct khớp ngưỡng UI 40/70', () => {
    expect(masteryPct(START_RATING)).toBe(30);
    expect(masteryPct(REF_RATING)).toBe(50);
    expect(masteryPct(1500)).toBe(70);
  });

  it('học viên mới đứng đúng mốc câu vừa', () => {
    expect(DIFFICULTY_RATING.medium).toBe(START_RATING);
  });

  it('K giảm dần theo số câu đã trả lời', () => {
    expect(kUser(0)).toBe(80);
    expect(kUser(20)).toBe(40);
    expect(kQuestion(0)).toBe(40);
    expect(kQuestion(20)).toBe(20);
  });

  it('rate: đúng thì học viên lên, câu xuống; sai thì ngược lại', () => {
    expect(rate(1200, 1200, true, 0, 0)).toEqual({ user: 1240, question: 1180 });
    expect(rate(1200, 1200, false, 0, 0)).toEqual({ user: 1160, question: 1220 });
  });

  it('rate: làm đúng câu khó được cộng nhiều hơn câu dễ', () => {
    const easy = rate(1200, DIFFICULTY_RATING.easy, true, 0, 0).user - 1200;
    const hard = rate(1200, DIFFICULTY_RATING.hard, true, 0, 0).user - 1200;
    expect(hard).toBeGreaterThan(easy);
  });

  describe('isCorrectAnswer', () => {
    const opts = [{ id: 'a', isCorrect: true }, { id: 'b', isCorrect: true }, { id: 'c', isCorrect: false }];
    it.each([
      [['a', 'b'], true],
      [['b', 'a'], true],
      [['a', 'a', 'b'], true],
      [['a'], false],
      [['a', 'b', 'c'], false],
      [[], false],
      [['a', 'b', 'x'], false],
    ])('%j → %s', (sel, ok) => expect(isCorrectAnswer(opts, sel as string[])).toBe(ok));
  });

  describe('pickNext', () => {
    const q = (id: string, rating: number, lastSeenAt: number | null = null) => ({ id, rating, lastSeenAt });

    it('ưu tiên câu chưa gặp dù xa mức hơn', () => {
      expect(pickNext(1200, [q('seen', 1200, 1), q('new', 1400)], () => 0)).toBe('new');
    });

    it('chọn ngẫu nhiên trong 3 câu gần mức nhất', () => {
      const cs = [q('a', 1000), q('b', 1190), q('c', 1215), q('d', 1230), q('e', 1500)];
      expect(pickNext(1200, cs, () => 0)).toBe('b');
      expect(pickNext(1200, cs, () => 0.99)).toBe('d');
    });

    it('hết câu mới → chỉ lấy trong 12 câu gặp lâu nhất', () => {
      const old = Array.from({ length: 12 }, (_, i) => q(`old${i}`, 1300, i));
      const recent = [q('r1', 1200, 100), q('r2', 1200, 101)];
      expect(pickNext(1200, [...recent, ...old], () => 0)).toMatch(/^old/);
    });

    it('không còn câu → null', () => {
      expect(pickNext(1200, [], () => 0)).toBeNull();
    });
  });
});
