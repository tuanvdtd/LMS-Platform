import type { AuditAction, LockDuration, OverviewRange, RoleFilter, StatusFilter, UsersFilter } from '@/types/admin';

export const ROLE_FILTER_LABEL: Record<RoleFilter, string> = {
  all: 'Mọi vai trò',
  student: 'Học viên',
  instructor: 'Giảng viên',
  verified: 'Giảng viên cao cấp',
};
export const STATUS_FILTER_LABEL: Record<StatusFilter, string> = { all: 'Mọi trạng thái', active: 'Hoạt động', locked: 'Đã khoá' };
export const LOCK_DURATION_LABEL: Record<LockDuration, string> = { '7d': '7 ngày', '30d': '30 ngày', permanent: 'Vĩnh viễn' };
export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  user_lock: 'Khoá tài khoản',
  user_unlock: 'Mở khoá tài khoản',
  user_revoke_sessions: 'Đăng xuất mọi thiết bị',
};
export const LOGIN_METHOD_LABEL: Record<string, string> = { credential: 'Email và mật khẩu', google: 'Google', github: 'GitHub' };
export const RANGE_LABEL: Record<OverviewRange, string> = { '7d': '7 ngày', '30d': '30 ngày', '90d': '90 ngày' };
export const LOCK_REASON_MIN = 5;
export const LOCK_REASON_MAX = 500;

// % thay đổi, 1 chữ số thập phân. Kỳ trước = 0 thì không có % (FE hiện "Mới" hoặc "—").
export function changePct(value: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((value - prev) / prev) * 1000) / 10;
}

// "Chrome trên Windows": đủ để admin nhận ra thiết bị, không cần thư viện UA.
// Thứ tự kiểm quan trọng: Edge/Opera chứa "Chrome", Chrome chứa "Safari", iOS chứa "Mac OS X", Android chứa "Linux".
export function describeUserAgent(ua: string | null): string {
  if (!ua) return 'Không rõ thiết bị';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : null;
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /iPhone|iPad/.test(ua)
      ? 'iOS'
      : /Android/.test(ua)
        ? 'Android'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : null;
  if (!browser && !os) return 'Thiết bị khác';
  return os ? `${browser ?? 'Trình duyệt khác'} trên ${os}` : browser!;
}

const VN = 7 * 3_600_000;
const pad = (n: number) => String(n).padStart(2, '0');
const vn = (iso: string) => new Date(new Date(iso).getTime() + VN);
export const formatDate = (iso: string) => {
  const d = vn(iso);
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
};
export const formatDateTime = (iso: string) => {
  const d = vn(iso);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} ${formatDate(iso)}`;
};

const isRole = (v: string | null): v is RoleFilter => !!v && Object.hasOwn(ROLE_FILTER_LABEL, v);
const isStatus = (v: string | null): v is StatusFilter => !!v && Object.hasOwn(STATUS_FILTER_LABEL, v);

// Bộ lọc danh sách người dùng nằm trên URL → quay lại từ trang chi tiết vẫn giữ.
export function parseUsersFilter(sp: URLSearchParams): UsersFilter {
  const role = sp.get('role');
  const status = sp.get('status');
  const page = Number(sp.get('page'));
  return {
    q: sp.get('q') ?? '',
    role: isRole(role) ? role : 'all',
    status: isStatus(status) ? status : 'all',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

// Bộ lọc gần nhất của danh sách (sống qua điều hướng phía client, rỗng khi tải lại trang) → link quay lại giữ bộ lọc.
let lastUsersQuery = '';
export const rememberUsersQuery = (q: string) => {
  lastUsersQuery = q;
};
export const usersListHref = () => `/admin/users${lastUsersQuery}`;

export function usersFilterQuery(f: UsersFilter): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.role !== 'all') p.set('role', f.role);
  if (f.status !== 'all') p.set('status', f.status);
  if (f.page > 1) p.set('page', String(f.page));
  const s = p.toString();
  return s ? `?${s}` : '';
}
