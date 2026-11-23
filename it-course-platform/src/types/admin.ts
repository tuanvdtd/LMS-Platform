// Khớp API /admin/overview và /admin/users (back-end/src/admin). Ngày là chuỗi ISO.
export type OverviewRange = '7d' | '30d' | '90d';
export type KpiKey = 'gmv' | 'platformFee' | 'paidOrders' | 'newUsers' | 'newEnrollments' | 'newCourses';

export type AdminOverview = {
  range: OverviewRange;
  from: string;
  to: string;
  kpis: Record<KpiKey, { value: number; prev: number }>;
  daily: { date: string; gmv: number; platformFee: number }[];
  payouts: { pendingCount: number; pendingAmount: number; unsettledAmount: number };
  queues: { courseApprovals: number; instructorApplications: number; payouts: number };
  topCourses: { id: string; title: string; instructorName: string; orders: number; revenue: number }[];
  totals: { users: number; verifiedInstructors: number; publishedCourses: number };
};

export type PersonalRole = 'student' | 'instructor';
export type UserStatus = 'active' | 'locked';
export type RoleFilter = 'all' | 'student' | 'instructor' | 'verified';
export type StatusFilter = 'all' | UserStatus;
export type UsersFilter = { q: string; role: RoleFilter; status: StatusFilter; page: number };
export type LockDuration = '7d' | '30d' | 'permanent';
export type AuditAction = 'user_lock' | 'user_unlock' | 'user_revoke_sessions';

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  roles: PersonalRole[];
  verified: boolean;
  status: UserStatus;
  lockedUntil: string | null;
  enrollmentCount: number;
  courseCount: number;
};

export type AdminUserDetail = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  createdAt: string;
  roles: PersonalRole[];
  twoFactorEnabled: boolean;
  loginMethods: string[];
  verifiedAt: string | null;
  status: UserStatus;
  lockReason: string | null;
  lockedUntil: string | null;
  learning: {
    enrollmentCount: number;
    completedCount: number;
    recent: { courseId: string; title: string; slug: string; progressPct: number; enrolledAt: string; completedAt: string | null }[];
  };
  purchases: {
    paidOrderCount: number;
    totalSpent: number;
    recent: { id: string; status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'; totalAmount: number; createdAt: string; paidAt: string | null; courses: string[] }[];
  };
  teaching: null | {
    courseCount: number;
    publishedCount: number;
    totalEarned: number;
    recent: { id: string; title: string; status: 'draft' | 'in_review' | 'published' | 'unpublished'; enrollmentCount: number }[];
  };
  sessions: { id: string; ipAddress: string | null; userAgent: string | null; createdAt: string; updatedAt: string }[];
  audit: { id: string; action: AuditAction; actorName: string | null; data: { reason?: string | null; expiresAt?: string | null }; createdAt: string }[];
};
