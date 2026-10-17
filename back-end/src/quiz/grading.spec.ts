import { ema, grade, seededShuffle } from './grading.js';

const single = { id: 'q1', type: 'single_choice' as const, points: 1, options: [{ id: 'a', isCorrect: true }, { id: 'b', isCorrect: false }] };
const multi = { id: 'q2', type: 'multiple_choice' as const, points: 1, options: [{ id: 'c', isCorrect: true }, { id: 'd', isCorrect: true }, { id: 'e', isCorrect: false }] };

describe('grade', () => {
  it('đúng hết → 100', () => {
    const r = grade([single, multi], [{ questionId: 'q1', optionIds: ['a'] }, { questionId: 'q2', optionIds: ['d', 'c'] }]);
    expect(r).toMatchObject({ correctCount: 2, total: 2, scorePct: 100 });
  });
  it('nhiều đáp án thiếu hoặc thừa → sai', () => {
    expect(grade([multi], [{ questionId: 'q2', optionIds: ['c'] }]).scorePct).toBe(0);
    expect(grade([multi], [{ questionId: 'q2', optionIds: ['c', 'd', 'e'] }]).scorePct).toBe(0);
  });
  it('một đáp án mà chọn 2 → sai', () => {
    expect(grade([single], [{ questionId: 'q1', optionIds: ['a', 'b'] }]).answers[0].isCorrect).toBe(false);
  });
  it('không trả lời → sai, vẫn có dòng answer rỗng; câu lạ bị bỏ qua; option lạ bị lọc', () => {
    const r = grade([single, multi], [{ questionId: 'zzz', optionIds: ['a'] }, { questionId: 'q1', optionIds: ['a', 'x'] }]);
    expect(r.answers.map((a) => a.questionId)).toEqual(['q1', 'q2']);
    expect(r.answers[0]).toMatchObject({ selectedOptionIds: ['a'], isCorrect: true, pointsAwarded: 1 });
    expect(r.answers[1]).toMatchObject({ selectedOptionIds: [], isCorrect: false, pointsAwarded: 0 });
  });
  it('làm tròn 2 chữ số', () => {
    const q3 = { ...single, id: 'q3' };
    expect(grade([single, multi, q3], [{ questionId: 'q1', optionIds: ['a'] }]).scorePct).toBe(33.33);
  });
});

describe('seededShuffle', () => {
  const xs = Array.from({ length: 20 }, (_, i) => i);
  it('cùng seed → cùng thứ tự, là hoán vị, không đổi mảng gốc', () => {
    const a = seededShuffle(xs, 'seed-1');
    expect(seededShuffle(xs, 'seed-1')).toEqual(a);
    expect([...a].sort((x, y) => x - y)).toEqual(xs);
    expect(xs[0]).toBe(0);
  });
  it('khác seed → thường khác thứ tự', () => {
    expect(seededShuffle(xs, 'seed-1')).not.toEqual(seededShuffle(xs, 'seed-2'));
  });
});

describe('ema', () => {
  it('lần đầu = s, sau đó 0.7·cũ + 0.3·s', () => {
    expect(ema(null, 0.8)).toBe(0.8);
    expect(ema({ score: 0.5, attemptsCount: 0 }, 0.8)).toBe(0.8);
    expect(ema({ score: 0.5, attemptsCount: 2 }, 1)).toBeCloseTo(0.65);
  });
});
