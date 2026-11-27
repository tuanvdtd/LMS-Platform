// Giới hạn thời gian và số lượt của quiz. Thuần, không đụng DB.

// Khoảng dư sau hạn nộp: bù mạng chậm khi trang tự nộp đúng lúc hết giờ.
export const GRACE_SEC = 30;
export const ATTEMPT_WINDOW_MS = 24 * 60 * 60_000;

export const deadlineOf = (startedAt: Date, timeLimitMin: number | null): Date | null =>
  timeLimitMin == null ? null : new Date(startedAt.getTime() + timeLimitMin * 60_000);

// Quá hạn + khoảng dư → máy chủ không nhận đáp án của lượt này nữa.
export const isOverdue = (deadline: Date | null, now: Date): boolean =>
  deadline != null && now.getTime() > deadline.getTime() + GRACE_SEC * 1000;

export const remainingSec = (deadline: Date | null, now: Date): number | null =>
  deadline == null ? null : Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));

// Cửa sổ trượt 24 giờ theo giờ bắt đầu lượt. Hết lượt → có lại khi đủ số lượt cũ rơi khỏi cửa sổ.
export function attemptQuota(maxAttempts: number | null, startedAts: Date[], now: Date) {
  if (maxAttempts == null) return { attemptsLeft: null, nextAttemptAt: null };
  const inWindow = startedAts
    .map((d) => d.getTime())
    .filter((ms) => ms > now.getTime() - ATTEMPT_WINDOW_MS)
    .sort((a, b) => a - b);
  const attemptsLeft = Math.max(0, maxAttempts - inWindow.length);
  const nextAttemptAt = attemptsLeft ? null : new Date(inWindow[inWindow.length - maxAttempts] + ATTEMPT_WINDOW_MS);
  return { attemptsLeft, nextAttemptAt };
}
