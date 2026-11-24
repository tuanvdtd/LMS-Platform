import type { PrismaService } from '../infra/prisma.service.js';

// Item đã xuất bản theo thứ tự curriculum, kèm nhãn "phần.bài" (2.4) để giảng viên đối chiếu với trình soạn.
export async function publishedItems(prisma: PrismaService, courseId: string) {
  const sections = await prisma.section.findMany({
    where: { courseId },
    orderBy: { position: 'asc' },
    select: {
      items: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
        select: { id: true, type: true, title: true, lectureKind: true, durationSec: true },
      },
    },
  });
  return sections.flatMap((s, si) => s.items.map((it, ii) => ({ ...it, label: `${si + 1}.${ii + 1}` })));
}
export type PublishedItem = Awaited<ReturnType<typeof publishedItems>>[number];
export const isVideo = (it: PublishedItem) => it.type === 'lecture' && it.lectureKind === 'video' && it.durationSec > 0;
