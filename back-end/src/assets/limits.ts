export const GB = 1024 ** 3;

// Hạn mức theo từng giảng viên. premium = đã có hồ sơ giảng viên được duyệt.
export const LIMITS = {
  standard: { storageBytes: 5 * GB, videoSecondsPerMonth: 120 * 60 },
  premium: { storageBytes: 50 * GB, videoSecondsPerMonth: 3000 * 60 },
} as const;
export type Tier = keyof typeof LIMITS;
export type TierLimits = (typeof LIMITS)[Tier];

export const UPLOADS_PER_HOUR = 60;
// Link upload sống 10 phút; dòng uploading quá 1 giờ coi như bỏ dở: không tính vào dung lượng, thư viện hiện là lỗi.
export const STALE_UPLOAD_MS = 60 * 60_000;
// Dài hơn một tháng để bộ đếm không hết hạn giữa tháng.
export const VIDEO_COUNTER_TTL_SEC = 40 * 86_400;

export const tierOf = (hasProfile: boolean): Tier => (hasProfile ? 'premium' : 'standard');

// Bộ đếm giây video theo tháng UTC.
export const videoMonthKey = (userId: string, now = new Date()) => `video-sec:${userId}:${now.toISOString().slice(0, 7)}`;

const gb = (bytes: number) => (bytes / GB).toLocaleString('vi-VN', { maximumFractionDigits: 1 });

export const storageFullMessage = (usedBytes: number, limitBytes: number) =>
  `Đã dùng ${gb(usedBytes)} / ${gb(limitBytes)} GB dung lượng. Hãy xoá bớt file chưa dùng trong Thư viện file`;

export const videoMinutesFullMessage = (usedSec: number, limitSec: number) =>
  `Tháng này bạn đã tải lên ${Math.floor(usedSec / 60)} / ${limitSec / 60} phút video. Hạn mức sẽ làm mới vào đầu tháng sau`;
