// Vai trò giảng viên. File thuần, không import alias → test bằng node:test.
type MaybeUser = { role?: string | null } | null | undefined;

// Better Auth admin plugin lưu nhiều vai trò dạng "user,instructor".
const hasRole = (user: MaybeUser, role: string) => !!user?.role?.split(',').includes(role);

export const isAdmin = (user: MaybeUser) => hasRole(user, 'admin');
export const isModerator = (user: MaybeUser) => hasRole(user, 'moderator');
// Tài khoản nghiệp vụ: BE chặn học, mua, dạy → FE ẩn các luồng đó.
export const isStaff = (user: MaybeUser) => isAdmin(user) || isModerator(user);

// Staff có kèm role instructor vẫn bị BE chặn dạy → coi như không phải giảng viên.
export function isInstructor(user: MaybeUser): boolean {
  return hasRole(user, 'instructor') && !isStaff(user);
}

// Đích của "Dạy học" / "Chuyển sang Giảng viên": giảng viên vào thẳng dashboard, còn lại vào landing.
export function teachHref(user: MaybeUser): '/instructor' | '/teach' {
  return isInstructor(user) ? '/instructor' : '/teach';
}
