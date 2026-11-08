import { SKILL_BANK } from './data/index.ts';
import type { SkillSeedQuestion } from './types.ts';
import { validateBank } from './validate.ts';

const q = (over: Partial<SkillSeedQuestion> = {}): SkillSeedQuestion => ({
  difficulty: 'easy', type: 'single_choice', stem: 'Đề',
  options: [{ content: 'A', correct: true }, { content: 'B' }], ...over,
});

describe('validateBank', () => {
  it('bắt câu một đáp án có 2 đáp án đúng', () => {
    const errs = validateBank({ html: [q({ options: [{ content: 'A', correct: true }, { content: 'B', correct: true }] })] }, { strict: false });
    expect(errs.join()).toMatch(/đúng 1 đáp án đúng/);
  });
  it('bắt câu nhiều đáp án có < 2 đáp án đúng', () => {
    expect(validateBank({ html: [q({ type: 'multiple_choice' })] }, { strict: false }).join()).toMatch(/≥ 2 đáp án đúng/);
  });
  it('bắt đề trùng trong cùng topic (bỏ khoảng trắng, không phân biệt hoa thường)', () => {
    expect(validateBank({ html: [q({ stem: 'Thẻ  nào?' }), q({ stem: 'thẻ nào?' })] }, { strict: false }).join()).toMatch(/trùng/);
  });
  it('bắt đáp án trùng trong một câu', () => {
    expect(validateBank({ html: [q({ options: [{ content: 'A', correct: true }, { content: 'a' }] })] }, { strict: false }).join()).toMatch(/đáp án trùng/);
  });
  it('topic html hợp lệ (không strict)', () => {
    expect(validateBank({ html: SKILL_BANK.html }, { strict: false })).toEqual([]);
  });
  // Guard chống lộ đáp án chỉ chạy ở strict; lọc lỗi "thiếu topic"/số câu vì test chỉ nhắm các guard.
  const guards = (qs: SkillSeedQuestion[]) =>
    validateBank({ html: qs }, { strict: true }).filter((e) => /multiple_choice|dài nhất|vị trí/.test(e)).join('\n');
  const single = (correctAt: number, lens: number[]): SkillSeedQuestion =>
    q({ options: lens.map((n, i) => ({ content: 'x'.repeat(n) + i, ...(i === correctAt ? { correct: true as const } : {}) })) });
  it('strict: bắt topic có ngoài 8–10 câu multiple_choice', () => {
    expect(guards([q()])).toMatch(/cần 8–10 câu multiple_choice, có 0/);
  });
  it('strict: bắt > 35% câu có đáp án đúng dài nhất duy nhất', () => {
    expect(guards([single(0, [9, 3, 3, 3]), single(1, [3, 9, 3, 3])])).toMatch(/dài nhất duy nhất/);
    expect(guards([single(0, [3, 3, 3, 3])])).not.toMatch(/dài nhất/); // bằng nhau → không duy nhất
  });
  it('strict: bắt một vị trí chứa > 40% đáp án đúng của single_choice', () => {
    expect(guards([single(2, [3, 3, 3, 3]), single(2, [3, 3, 3, 3]), single(0, [3, 3, 3, 3])])).toMatch(/vị trí 3 chứa 2\/3/);
  });
  it('strict: bắt một vị trí đúng trong > 70% câu multiple_choice', () => {
    const m = (a: boolean, b: boolean) => q({ type: 'multiple_choice', options: [{ content: 'A', ...(a ? { correct: true as const } : {}) }, { content: 'B', ...(b ? { correct: true as const } : {}) }, { content: 'C', correct: true }, { content: 'D' }] });
    expect(guards([m(true, true), m(true, true), m(true, true), m(false, true)])).toMatch(/vị trí 3 đúng ở 4\/4/);
  });
  it('strict: câu single không có đáp án đúng báo lỗi thường, không ném', () => {
    const none = q({ options: [{ content: 'A' }, { content: 'B' }] });
    expect(() => validateBank({ html: [none] }, { strict: true })).not.toThrow();
    expect(validateBank({ html: [none] }, { strict: true }).join()).toMatch(/đúng 1 đáp án đúng/);
  });
  it('strict: html đạt mọi guard chống lộ đáp án', () => {
    expect(guards(SKILL_BANK.html)).toBe('');
  });
  it('strict: đủ 8 topic × 40 câu, độ khó 12–14 / 13–15 / 12–14', () => {
    expect(validateBank(SKILL_BANK, { strict: true })).toEqual([]);
  });
});
