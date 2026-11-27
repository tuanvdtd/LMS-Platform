import { applicationMissing, maskAccountNo } from './application-rules.js';

const full = { headline: 'h', bio: 'b', termsAcceptedAt: new Date(), identityStatus: 'approved' as const, bankBin: '970436' };

describe('applicationMissing', () => {
  it('đủ 5 bước → []', () => expect(applicationMissing(full, 'https://img')).toEqual([]));
  it('chưa có đơn, chưa có ảnh → đủ 5 bước theo thứ tự', () =>
    expect(applicationMissing(null, null).map((m) => m.step)).toEqual(['info', 'avatar', 'terms', 'identity', 'payout']));
  it('chưa có đơn nhưng có ảnh (đăng nhập Google) → không thiếu ảnh', () =>
    expect(applicationMissing(null, 'https://g').map((m) => m.step)).toEqual(['info', 'terms', 'identity', 'payout']));
  it('thiếu bio là thiếu bước info', () =>
    expect(applicationMissing({ ...full, bio: null }, 'x').map((m) => m.step)).toEqual(['info']));
  it.each(['pending', 'in_review', 'declined', null] as const)('xác minh %s → còn thiếu identity', (s) =>
    expect(applicationMissing({ ...full, identityStatus: s }, 'x').map((m) => m.step)).toEqual(['identity']));
});

describe('maskAccountNo', () => {
  it('giữ 4 số cuối', () => expect(maskAccountNo('0123456789')).toBe('••••6789'));
  it('null → null', () => expect(maskAccountNo(null)).toBeNull());
});
