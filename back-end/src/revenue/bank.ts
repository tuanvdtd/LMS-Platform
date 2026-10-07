// Tên chủ TK như in trên app ngân hàng: bỏ dấu, IN HOA, gộp khoảng trắng (spec §4.1).
export function normalizeAccountName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

type QrInput = { bankBin: string; bankAccountNo: string; bankAccountName: string; amount: number; period: string };

// Ảnh QR VietQR công khai (spec §3.5, R8): admin quét bằng app ngân hàng, mọi trường đã điền sẵn.
export function vietQrUrl(p: QrInput): string {
  const qs = new URLSearchParams({
    amount: String(p.amount),
    addInfo: `SKILLPATH ${p.period}`,
    accountName: p.bankAccountName,
  });
  return `https://img.vietqr.io/image/${p.bankBin}-${p.bankAccountNo}-compact2.png?${qs}`;
}
