// Vai trò giảng viên (spec teach-landing §3.1). File thuần, không import alias → test bằng node:test.
type MaybeUser = { role?: string | null } | null | undefined;

// Better Auth admin plugin lưu nhiều vai trò dạng "user,instructor".
export function isInstructor(user: MaybeUser): boolean {
  return !!user?.role?.split(',').includes('instructor');
}

// Đích của "Dạy học" / "Chuyển sang Giảng viên": giảng viên vào thẳng dashboard, còn lại vào landing.
export function teachHref(user: MaybeUser): '/instructor' | '/teach' {
  return isInstructor(user) ? '/instructor' : '/teach';
}
