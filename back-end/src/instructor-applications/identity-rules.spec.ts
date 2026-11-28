import { createHmac } from 'node:crypto';
import { documentHash, mapDiditStatus, pickName, verifyDiditWebhook } from './identity-rules.js';

describe('mapDiditStatus', () => {
  it.each([
    ['Not Started', 'pending'],
    ['In Progress', 'pending'],
    ['Resubmitted', 'pending'],
    ['In Review', 'in_review'],
    ['Approved', 'approved'],
    ['APPROVED', 'approved'],
    ['Declined', 'declined'],
    ['Expired', 'expired'],
    ['Abandoned', 'expired'],
    ['Kyc Expired', 'expired'],
  ])('%s → %s', (s, want) => expect(mapDiditStatus(s)).toBe(want));
  it('chuỗi lạ / thiếu → undefined', () => {
    expect(mapDiditStatus('Awaiting User')).toBeUndefined();
    expect(mapDiditStatus(undefined)).toBeUndefined();
  });
});

describe('pickName', () => {
  it('ưu tiên full_name', () =>
    expect(pickName({ id_verifications: [{ full_name: ' NGUYEN VAN A ', first_name: 'A', last_name: 'X' }] })).toBe('NGUYEN VAN A'));
  it('không có full_name → ghép first + last', () =>
    expect(pickName({ id_verifications: [{ first_name: 'VAN A', last_name: 'NGUYEN' }] })).toBe('VAN A NGUYEN'));
  it('không có tên / không có mảng → null', () => {
    expect(pickName({ id_verifications: [{}] })).toBeNull();
    expect(pickName({})).toBeNull();
  });
});

describe('verifyDiditWebhook', () => {
  const secret = 'whsec_test';
  const now = 1_800_000_000;
  const body = (extra: object = {}) => Buffer.from(JSON.stringify({ session_id: 's1', status: 'Approved', timestamp: now, ...extra }));
  const sign = (raw: Buffer) => createHmac('sha256', secret).update(raw).digest('hex');

  it('chữ ký đúng, đúng giờ → trả body đã parse', () => {
    const raw = body();
    expect(verifyDiditWebhook(raw, sign(raw), secret, now)).toMatchObject({ session_id: 's1' });
  });
  it('chữ ký hex viết hoa vẫn nhận', () => {
    const raw = body();
    expect(verifyDiditWebhook(raw, sign(raw).toUpperCase(), secret, now)).not.toBeNull();
  });
  it('chữ ký của body khác → null', () => expect(verifyDiditWebhook(body(), sign(body({ status: 'Declined' })), secret, now)).toBeNull());
  it('chữ ký sai độ dài / không phải hex / thiếu → null, không ném lỗi', () => {
    expect(verifyDiditWebhook(body(), 'abc', secret, now)).toBeNull();
    expect(verifyDiditWebhook(body(), 'z'.repeat(64), secret, now)).toBeNull();
    expect(verifyDiditWebhook(body(), undefined, secret, now)).toBeNull();
  });
  it('timestamp trong body lệch 301s → null; lệch 300s → nhận', () => {
    const old = body({ timestamp: now - 301 });
    expect(verifyDiditWebhook(old, sign(old), secret, now)).toBeNull();
    const edge = body({ timestamp: now + 300 });
    expect(verifyDiditWebhook(edge, sign(edge), secret, now)).not.toBeNull();
  });
  it('thiếu timestamp / body không phải JSON object → null', () => {
    const noTs = Buffer.from('{"session_id":"s1"}');
    expect(verifyDiditWebhook(noTs, sign(noTs), secret, now)).toBeNull();
    const notJson = Buffer.from('not json');
    expect(verifyDiditWebhook(notJson, sign(notJson), secret, now)).toBeNull();
  });
});

describe('documentHash', () => {
  const doc = (document_number?: string | null, issuing_state = 'VNM', personal_number?: string) => ({
    id_verifications: [{ document_number, personal_number, issuing_state }],
  });

  it('cùng số khác cách viết → cùng mã; khác nước cấp hoặc khác secret → khác mã', () => {
    const h = documentHash(doc('079 204-001234'), 's');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(documentHash(doc('079204001234'), 's')).toBe(h);
    expect(documentHash(doc('079204001234', 'USA'), 's')).not.toBe(h);
    expect(documentHash(doc('079204001234'), 'other')).not.toBe(h);
  });

  it('thiếu document_number thì dùng personal_number; không có số nào → null', () => {
    expect(documentHash(doc(null, 'VNM', '079204001234'), 's')).toBe(documentHash(doc('079204001234'), 's'));
    expect(documentHash(doc(null), 's')).toBeNull();
    expect(documentHash({}, 's')).toBeNull();
  });
});
