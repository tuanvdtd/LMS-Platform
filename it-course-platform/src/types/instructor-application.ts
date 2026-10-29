import type { BankAccount } from '@/types/revenue';

// Khớp response API module instructor-applications.
export type ApplicationStep = 'info' | 'avatar' | 'terms' | 'payout';
export type ApplicationDisplayStatus = 'none' | 'draft' | 'pending' | 'approved' | 'rejected';
export type ReviewedStatus = 'pending' | 'approved' | 'rejected';

export const STEP_LABEL: Record<ApplicationStep, string> = {
  info: 'Thông tin cá nhân',
  avatar: 'Ảnh hồ sơ',
  terms: 'Điều khoản',
  payout: 'Tài khoản nhận tiền',
};
export const STEPS = Object.keys(STEP_LABEL) as ApplicationStep[];

export const REVIEW_STATUS_LABEL: Record<ReviewedStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
};

// BE kiểm lại; FE chỉ để đếm và báo sớm.
export const BIO_MIN_WORDS = 50;
export const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;
export const AVATAR_MAX_BYTES = 5 * 1024 ** 2;
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type Socials = { linkedin?: string; github?: string };

export type ApplicationView = {
  displayStatus: ApplicationDisplayStatus;
  name: string;
  image: string | null;
  headline: string | null;
  bio: string | null;
  website: string | null;
  socials: Socials;
  termsAccepted: boolean;
  bank: BankAccount | null;
  submittedAt: string | null;
  rejectReason: string | null;
  missing: { step: ApplicationStep; message: string }[];
  revenueSharePct: number;
};

export type InfoPayload = { name: string; headline: string; bio: string; website?: string; socials: Socials };

type Person = { id: string; name: string; email: string; image: string | null };

export type AdminApplicationRow = {
  id: string;
  status: ReviewedStatus;
  headline: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  user: Person;
};

export type AdminApplicationDetail = AdminApplicationRow & {
  bio: string | null;
  website: string | null;
  socials: Socials;
  termsAcceptedAt: string | null;
  bankBin: string | null;
  bankAccountName: string | null;
  bankAccountNoMasked: string | null;
  rejectReason: string | null;
  reviewedBy: { id: string; name: string } | null;
  user: Person & { createdAt: string };
  courseCount: number;
};
