export type ApplicationStep = 'info' | 'avatar' | 'terms' | 'payout';
export type MissingStep = { step: ApplicationStep; message: string };

type Draft = {
  headline: string | null;
  bio: string | null;
  termsAcceptedAt: Date | null;
  bankBin: string | null;
} | null;

// Bước còn thiếu, theo thứ tự wizard. Ảnh nằm ở user.image (đăng nhập Google đã có sẵn).
// Dùng chung cho GET (FE mở đúng bước) và submit (chặn đơn thiếu).
export function applicationMissing(app: Draft, image: string | null): MissingStep[] {
  const missing: MissingStep[] = [];
  if (!app?.headline || !app.bio) missing.push({ step: 'info', message: 'Chưa điền thông tin cá nhân' });
  if (!image) missing.push({ step: 'avatar', message: 'Chưa có ảnh hồ sơ' });
  if (!app?.termsAcceptedAt) missing.push({ step: 'terms', message: 'Chưa đồng ý điều khoản' });
  if (!app?.bankBin) missing.push({ step: 'payout', message: 'Chưa khai tài khoản nhận tiền' });
  return missing;
}

// Màn duyệt đơn không cần số tài khoản đầy đủ.
export const maskAccountNo = (no: string | null) => (no ? `••••${no.slice(-4)}` : null);
