import type { PrismaClient } from '@prisma/client';
import { REVIEW_TEMPLATES } from './data/reviews.ts';
import { DAY, HOUR, addMs, between, chance, minDate, pick, weighted, type Rng } from './rng.ts';

// Khoá trình diễn (huy.do): đánh giá như planActivity (≥ 50% tiến độ, ~37,5%) + 2 đánh giá 2★ gần đây của người mua (hộp "Cần xử lý"
// và nút "Nhắn tin" trên Tổng quan) + 3 câu hỏi chưa trả lời. Luồng rng riêng.
const QUESTIONS = [
  'Cho em hỏi sao `typeof null` lại ra `"object"` ạ? Em tưởng phải là `"null"`.',
  'Em dùng `for...in` với mảng thì ra chỉ số dạng chuỗi, vậy khi nào nên dùng `for...of` ạ?',
  'Em chạy `0.1 + 0.2` ra `0.30000000000000004`. Muốn so sánh hai số thực cho đúng thì làm thế nào ạ?',
];

export function planShowcaseExtras(
  rng: Rng,
  a: {
    now: Date; courseId: string; label: string; lectureIds: string[]; lectureTitles: string[];
    enrollments: readonly { userId: string; progressPct: number; lastAccessedAt: Date | null; orderId: string | null }[];
    id: () => string;
  },
) {
  const latest = addMs(a.now, -HOUR);
  const fill = (s: string) => s.replaceAll('{tech}', a.label).replaceAll('{lecture}', pick(rng, a.lectureTitles));
  const reviews: { courseId: string; userId: string; rating: number; comment: string; createdAt: Date; instructorReply: null; instructorRepliedAt: null }[] = [];
  const reviewed = new Set<string>();
  const eligible = a.enrollments.filter((e) => e.progressPct >= 50 && e.lastAccessedAt);
  for (const e of eligible) {
    if (!chance(rng, 0.375)) continue;
    const rating = weighted(rng, [[5, 50], [4, 35], [3, 12]] as const); // 2★ chỉ đặt tay bên dưới để số liệu demo rõ
    const createdAt = between(rng, e.lastAccessedAt!, minDate(latest, addMs(e.lastAccessedAt!, 14 * DAY)));
    reviews.push({ courseId: a.courseId, userId: e.userId, rating, comment: fill(pick(rng, REVIEW_TEMPLATES.vi[rating])), createdAt, instructorReply: null, instructorRepliedAt: null });
    reviewed.add(e.userId);
  }
  const lowCandidates = eligible.filter((e) => e.orderId && !reviewed.has(e.userId) && e.lastAccessedAt! <= addMs(a.now, -10 * DAY));
  [3, 9].forEach((daysAgo, i) => {
    const e = lowCandidates[i];
    if (!e) return;
    reviews.push({
      courseId: a.courseId, userId: e.userId, rating: 2, comment: fill(pick(rng, REVIEW_TEMPLATES.vi[2])),
      createdAt: addMs(a.now, -daysAgo * DAY), instructorReply: null, instructorRepliedAt: null,
    });
  });
  const askers = a.enrollments.filter((e) => e.progressPct > 0 && e.progressPct < 100 && e.lastAccessedAt && e.lastAccessedAt >= addMs(a.now, -14 * DAY));
  const questions = QUESTIONS.map((body, i) => {
    const e = askers[Math.floor((i * askers.length) / QUESTIONS.length)];
    const createdAt = between(rng, addMs(a.now, -6 * DAY), addMs(a.now, -1 * DAY));
    return e ? { id: a.id(), courseId: a.courseId, itemId: pick(rng, a.lectureIds), userId: e.userId, body, createdAt, updatedAt: createdAt } : null;
  }).filter((q) => q !== null);
  return { reviews, questions };
}

export async function writeShowcaseQuestions(prisma: PrismaClient, questions: ReturnType<typeof planShowcaseExtras>['questions']) {
  await prisma.courseQuestion.createMany({ data: questions });
}
