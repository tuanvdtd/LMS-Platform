import { authClient } from '@/lib/auth-client';
import { safeRedirect } from '@/lib/safe-redirect';

export const RATE_LIMITED = 'Bạn thử quá nhiều lần, vui lòng đợi vài phút';
export const NETWORK = 'Không kết nối được máy chủ, thử lại sau';
// Khoá 60s giữa 2 lần gửi lại. Gửi lại xác minh: BE cho 3 lần/60s; quên mật khẩu: 3 lần/10 phút → lần thứ 4 vẫn có thể 429
export const RESEND_COOLDOWN = 60;

export const GENERIC = 'Có lỗi xảy ra, vui lòng thử lại sau';

// Có status = server đã trả lời → không phải lỗi mạng
export const fallbackError = (status?: number) =>
  status === 429 ? RATE_LIMITED : status ? GENERIC : NETWORK;

// Tài khoản mới (xác minh email / OAuth lần đầu) đi qua onboarding; mang theo redirect để xong onboarding quay lại
// đúng trang đang dở (vd trang khoá học kèm ?action=add-to-cart).
export function onboardingUrl(redirect?: string) {
  const to = safeRedirect(redirect);
  return `${window.location.origin}/onboarding${to === '/' ? '' : `?redirect=${encodeURIComponent(to)}`}`;
}

// Bấm link xác minh → back-end autoSignInAfterVerification → về onboarding
export async function resendVerification(email: string, redirect?: string): Promise<string | null> {
  try {
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: onboardingUrl(redirect),
    });
    return error ? fallbackError(error.status) : null;
  } catch {
    return NETWORK;
  }
}
