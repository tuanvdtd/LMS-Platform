// Engine Elo cho bài đánh giá kỹ năng — Pelánek (2016), "Applications of the Elo rating system in adaptive
// educational systems". Thuần và KHÔNG import gì: seed-demo (--experimental-strip-types) dùng chung file này.

export type Difficulty = 'easy' | 'medium' | 'hard';

export const QUESTIONS_PER_ATTEMPT = 12;
export const TIME_LIMIT_MS = 15 * 60_000;
export const GRACE_MS = 10_000; // bù mạng chậm cho câu gửi sát hạn
export const COOLDOWN_MS = 24 * 3_600_000; // tính từ lúc BẮT ĐẦU lượt trước: mở bài xem câu rồi bỏ cũng phải chờ
export const MIN_ACTIVE_QUESTIONS = 12;
export const START_RATING = 1200;
export const DIFFICULTY_RATING: Record<Difficulty, number> = { easy: 1050, medium: 1200, hard: 1350 };
export const REF_RATING = 1350; // "câu khó chuẩn" cố định → % chỉ đổi khi học viên làm bài
export const PICK_POOL = 3;

export const expected = (rUser: number, rQ: number): number => 1 / (1 + 10 ** ((rQ - rUser) / 400));
// K giảm dần theo số câu đã trả lời: lúc đầu điểm nhảy nhanh, về sau ổn định.
export const kUser = (n: number): number => 80 / (1 + 0.05 * n);
export const kQuestion = (m: number): number => 40 / (1 + 0.05 * m);
export const masteryPct = (r: number): number => Math.round(100 * expected(r, REF_RATING));
export const deadlineOf = (startedAt: Date): Date => new Date(startedAt.getTime() + TIME_LIMIT_MS);
export const nextAvailableAt = (lastStartedAt: Date): Date => new Date(lastStartedAt.getTime() + COOLDOWN_MS);

// n / m = số câu học viên (ở topic này) / câu hỏi đã được trả lời TRƯỚC câu này.
export function rate(rUser: number, rQ: number, correct: boolean, n: number, m: number) {
  const p = expected(rUser, rQ);
  const s = correct ? 1 : 0;
  return { user: rUser + kUser(n) * (s - p), question: rQ - kQuestion(m) * (s - p) };
}

// Đúng = tập chọn trùng khít tập đáp án đúng. Rỗng ("Tôi không biết") hoặc có id lạ = sai.
export function isCorrectAnswer(
  options: readonly { id: string; isCorrect: boolean }[],
  selected: readonly string[],
): boolean {
  const picked = new Set(selected);
  const ids = new Set(options.map((o) => o.id));
  return picked.size > 0 && [...picked].every((id) => ids.has(id)) && options.every((o) => o.isCorrect === picked.has(o.id));
}

export type Candidate = { id: string; rating: number; lastSeenAt: number | null }; // null = chưa từng gặp

// Ưu tiên câu chưa gặp; hết thì 12 câu gặp lâu nhất. Trong nhóm lấy 3 câu có R gần học viên nhất (P(đúng) ≈ 50%,
// đo được nhiều nhất) rồi chọn ngẫu nhiên 1 để hai người cùng mức không gặp cùng một đề.
export function pickNext(rUser: number, candidates: readonly Candidate[], rng: () => number): string | null {
  const unseen = candidates.filter((c) => c.lastSeenAt === null);
  const pool = unseen.length
    ? unseen
    : [...candidates].sort((a, b) => a.lastSeenAt! - b.lastSeenAt!).slice(0, QUESTIONS_PER_ATTEMPT);
  if (!pool.length) return null;
  const near = [...pool]
    .sort((a, b) => Math.abs(a.rating - rUser) - Math.abs(b.rating - rUser) || a.id.localeCompare(b.id))
    .slice(0, PICK_POOL);
  return near[Math.floor(rng() * near.length)].id;
}
