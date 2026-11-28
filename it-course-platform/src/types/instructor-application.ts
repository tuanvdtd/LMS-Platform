import type { BankAccount } from '@/types/revenue';

// Khớp response API module instructor-applications.
export type ApplicationStep = 'info' | 'avatar' | 'terms' | 'identity' | 'payout';
export type ApplicationDisplayStatus = 'none' | 'draft' | 'pending' | 'approved' | 'rejected';
export type ReviewedStatus = 'pending' | 'approved' | 'rejected';

// Wizard gộp 5 bước của BE thành 4 màn; điều khoản đồng ý ngay ở màn gửi đơn.
export type Screen = 'profile' | 'identity' | 'payout' | 'review';
export const SCREEN_LABEL: Record<Screen, string> = {
  profile: 'Hồ sơ công khai',
  identity: 'Xác minh danh tính',
  payout: 'Tài khoản nhận tiền',
  review: 'Xem lại và gửi',
};
export const SCREENS = Object.keys(SCREEN_LABEL) as Screen[];
export const SCREEN_OF: Record<ApplicationStep, Screen> = {
  info: 'profile',
  avatar: 'profile',
  identity: 'identity',
  payout: 'payout',
  terms: 'review',
};

export type IdentityStatus = 'pending' | 'in_review' | 'approved' | 'declined';
export const IDENTITY_LABEL: Record<IdentityStatus, string> = {
  pending: 'Chưa hoàn tất',
  in_review: 'Đang được xem xét',
  approved: 'Đã xác minh',
  declined: 'Không thành công',
};

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
  identity: { status: IdentityStatus | null; name: string | null; issue: 'duplicate_document' | null };
  submittedAt: string | null;
  rejectReason: string | null;
  rejectedAt: string | null;
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
  identityStatus: IdentityStatus | null;
  identityName: string | null;
  rejectReason: string | null;
  reviewedBy: { id: string; name: string } | null;
  user: Person & { createdAt: string };
  courseCount: number;
};
