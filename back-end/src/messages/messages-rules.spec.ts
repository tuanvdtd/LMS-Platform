import { describe, expect, it } from 'vitest';
import { blockedState, cannotSend, isMessageImageKey, orderPair, otherOf, readField, readMarks, type ConvRow } from './messages-rules.js';

const A = '0190a000-0000-7000-8000-000000000001';
const B = '0190a000-0000-7000-8000-000000000002';
const row = (p: Partial<ConvRow> = {}): ConvRow => ({ userAId: A, userBId: B, aLastReadAt: null, bLastReadAt: null, blockedById: null, ...p });

describe('messages-rules', () => {
  it('orderPair xếp id nhỏ trước, cấm tự nhắn', () => {
    expect(orderPair(B, A)).toEqual([A, B]);
    expect(orderPair(A, B)).toEqual([A, B]);
    expect(() => orderPair(A, A)).toThrow();
  });
  it('otherOf / readField theo vị trí', () => {
    expect(otherOf(row(), A)).toBe(B);
    expect(otherOf(row(), B)).toBe(A);
    expect(readField(row(), A)).toBe('aLastReadAt');
    expect(readField(row(), B)).toBe('bLastReadAt');
  });
  it('readMarks trả mốc của tôi và người kia', () => {
    const t1 = new Date('2026-11-24T01:00:00Z');
    const t2 = new Date('2026-11-24T02:00:00Z');
    expect(readMarks(row({ aLastReadAt: t1, bLastReadAt: t2 }), B)).toEqual({ mine: t2, other: t1 });
  });
  it('blockedState', () => {
    expect(blockedState(row(), A)).toBe('none');
    expect(blockedState(row({ blockedById: A }), A)).toBe('me');
    expect(blockedState(row({ blockedById: A }), B)).toBe('other');
  });
  it('cannotSend: chặn ưu tiên hơn thiếu ghi danh trả phí', () => {
    expect(cannotSend(row(), A, true)).toBeNull();
    expect(cannotSend(row(), A, false)).toBe('NO_PAID_LINK');
    expect(cannotSend(row({ blockedById: A }), A, true)).toBe('BLOCKED_BY_ME');
    expect(cannotSend(row({ blockedById: B }), A, false)).toBe('BLOCKED_BY_OTHER');
  });
  it('isMessageImageKey chỉ nhận key đúng cuộc', () => {
    const id = '0190a000-0000-7000-8000-0000000000aa';
    expect(isMessageImageKey(id, `messages/${id}/0190a000-0000-7000-8000-0000000000bb.png`)).toBe(true);
    expect(isMessageImageKey(id, `messages/${id}/x.png`)).toBe(false);
    expect(isMessageImageKey(id, `messages/other/0190a000-0000-7000-8000-0000000000bb.png`)).toBe(false);
    expect(isMessageImageKey(id, `messages/${id}/../a.png`)).toBe(false);
  });
});
