import { normalizeAccountName, vietQrUrl } from './bank.js';

describe('normalizeAccountName', () => {
  it.each([
    ['Nguyễn Văn Đức', 'NGUYEN VAN DUC'],
    ['  trần   thị  hoà ', 'TRAN THI HOA'],
    ['đặng ĐÌNH', 'DANG DINH'],
  ])('%s → %s', (input, out) => {
    expect(normalizeAccountName(input)).toBe(out);
  });
});

describe('vietQrUrl', () => {
  it('điền sẵn số tiền, nội dung, tên chủ TK (encode)', () => {
    expect(
      vietQrUrl({
        bankBin: '970436',
        bankAccountNo: '0123456789',
        bankAccountName: 'NGUYEN VAN A',
        amount: 350_000,
        period: '2026-09',
      }),
    ).toBe(
      'https://img.vietqr.io/image/970436-0123456789-compact2.png' +
        '?amount=350000&addInfo=SKILLPATH+2026-09&accountName=NGUYEN+VAN+A',
    );
  });
});
