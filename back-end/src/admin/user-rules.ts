import type { Prisma } from '@prisma/client';

// Tài khoản nghiệp vụ (admin/moderator) quản lý ở trang Moderator, không bao giờ hiện ở /admin/users.
// role dạng "student,instructor"; role null coi là học viên.
export const NON_STAFF: Prisma.UserWhereInput = {
  OR: [{ role: null }, { NOT: [{ role: { contains: 'admin' } }, { role: { contains: 'moderator' } }] }],
};

const PERSONAL = ['student', 'instructor'] as const;
export type PersonalRole = (typeof PERSONAL)[number];
export const rolesOf = (role: string | null): PersonalRole[] =>
  role ? PERSONAL.filter((r) => role.split(',').includes(r)) : ['student'];

// Better Auth chỉ gỡ cờ banned khi người đó đăng nhập lại sau hạn → tự tính theo giờ hiện tại.
export function lockState(
  u: { banned: boolean | null; banReason: string | null; banExpires: Date | null },
  now = new Date(),
) {
  const locked = !!u.banned && (!u.banExpires || u.banExpires > now);
  return {
    status: locked ? ('locked' as const) : ('active' as const),
    lockReason: locked ? u.banReason : null,
    lockedUntil: locked ? u.banExpires : null,
  };
}

// Hai điều kiện Prisma bù nhau, khớp lockState.
export const lockedWhere = (now: Date): Prisma.UserWhereInput => ({
  banned: true,
  OR: [{ banExpires: null }, { banExpires: { gt: now } }],
});
export const activeWhere = (now: Date): Prisma.UserWhereInput => ({
  OR: [{ banned: false }, { banned: null }, { banExpires: { lte: now } }],
});

export type LockDuration = '7d' | '30d' | 'permanent';
const DAY_S = 86_400;
export const banSeconds = (d: LockDuration): number | undefined =>
  d === 'permanent' ? undefined : (d === '7d' ? 7 : 30) * DAY_S;
