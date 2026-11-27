import { describe, expect, it } from 'vitest';
import { attemptQuota, deadlineOf, isOverdue, remainingSec } from './quiz-limits.js';

const t0 = new Date('2026-11-27T10:00:00Z');
const at = (min: number) => new Date(t0.getTime() + min * 60_000);

describe('deadlineOf', () => {
  it('null khi không giới hạn', () => expect(deadlineOf(t0, null)).toBeNull());
  it('startedAt + số phút', () => expect(deadlineOf(t0, 15)).toEqual(at(15)));
});

describe('isOverdue', () => {
  const d = at(15);
  it('không giới hạn thì không bao giờ quá hạn', () => expect(isOverdue(null, at(9999))).toBe(false));
  it('trong khoảng dư 30 giây vẫn chưa quá hạn', () => expect(isOverdue(d, new Date(d.getTime() + 30_000))).toBe(false));
  it('quá khoảng dư thì quá hạn', () => expect(isOverdue(d, new Date(d.getTime() + 30_001))).toBe(true));
});

describe('remainingSec', () => {
  it('null khi không giới hạn', () => expect(remainingSec(null, t0)).toBeNull());
  it('làm tròn xuống', () => expect(remainingSec(at(1), new Date(t0.getTime() + 500))).toBe(59));
  it('không âm khi đã qua hạn', () => expect(remainingSec(t0, at(1))).toBe(0));
});

describe('attemptQuota', () => {
  const now = at(0);
  it('không giới hạn', () => expect(attemptQuota(null, [at(-1)], now)).toEqual({ attemptsLeft: null, nextAttemptAt: null }));
  it('còn lượt', () => expect(attemptQuota(3, [at(-60), at(-30)], now)).toEqual({ attemptsLeft: 1, nextAttemptAt: null }));
  it('hết lượt → lượt cũ nhất + 24 giờ', () =>
    expect(attemptQuota(2, [at(-30), at(-60)], now)).toEqual({ attemptsLeft: 0, nextAttemptAt: at(-60 + 24 * 60) }));
  it('bỏ lượt ngoài cửa sổ 24 giờ', () =>
    expect(attemptQuota(1, [at(-24 * 60 - 1)], now)).toEqual({ attemptsLeft: 1, nextAttemptAt: null }));
  it('GV giảm số lượt xuống dưới số đã làm → chờ tới khi số lượt trong cửa sổ < max', () =>
    expect(attemptQuota(1, [at(-10), at(-20), at(-30)], now)).toEqual({ attemptsLeft: 0, nextAttemptAt: at(-10 + 24 * 60) }));
});
