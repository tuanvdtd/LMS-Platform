import { fallbackError } from '@/app/(auth)/_components/auth-messages';

// Mã lỗi Better Auth (core + plugin twoFactor) → câu tiếng Việt nói rõ cách xử lý.
const MESSAGES: Record<string, string> = {
  INVALID_PASSWORD: 'Mật khẩu không đúng',
  PASSWORD_TOO_SHORT: 'Mật khẩu cần ít nhất 8 ký tự',
  PASSWORD_TOO_LONG: 'Mật khẩu tối đa 128 ký tự',
  INVALID_CODE: 'Mã không đúng hoặc đã hết hạn. Hãy nhập mã mới nhất trong ứng dụng.',
  INVALID_BACKUP_CODE: 'Mã dự phòng không đúng hoặc đã được dùng',
  TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: 'Bạn nhập sai quá nhiều lần. Hãy đăng nhập lại.',
  ACCOUNT_TEMPORARILY_LOCKED: 'Bạn nhập sai quá nhiều lần. Tài khoản tạm khoá xác thực trong 15 phút.',
  INVALID_TWO_FACTOR_COOKIE: 'Phiên xác thực đã hết hạn. Hãy đăng nhập lại.',
  FAILED_TO_UNLINK_LAST_ACCOUNT: 'Đây là cách đăng nhập duy nhất của bạn nên không huỷ liên kết được',
  STAFF_OAUTH_FORBIDDEN: 'Tài khoản nghiệp vụ chỉ đăng nhập bằng email và mật khẩu',
};

export type AuthError = { code?: string; status?: number };

export const securityError = (error: AuthError) => (error.code && MESSAGES[error.code]) || fallbackError(error.status);

// ?error= do back-end gắn khi liên kết Google/GitHub thất bại.
export const linkError = (code: string) =>
  code === 'account_already_linked_to_different_user'
    ? 'Tài khoản này đã liên kết với một người dùng SkillPath khác'
    : (MESSAGES[code] ?? 'Liên kết không thành công, vui lòng thử lại');
