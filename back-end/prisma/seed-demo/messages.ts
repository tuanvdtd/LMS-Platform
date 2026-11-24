import prismaPkg from '@prisma/client';

const { PrismaClient } = prismaPkg;
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

type Turn = { from: 'teacher' | 'student'; text: string; gapMin: number };

// Mỗi kịch bản: tin đầu gapMin = 0; các tin sau cách tin trước gapMin phút.
const lowRating = (ten: string, khoa: string, sao: number): Turn[] => [
  { from: 'teacher', gapMin: 0, text: `Chào ${ten}, mình thấy bạn đánh giá khoá "${khoa}" ${sao} sao nên nhắn hỏi thăm. Bạn gặp khó ở phần nào của khoá vậy?` },
  { from: 'student', gapMin: 95, text: `Dạ em chào ạ. Em bị rối ở mấy bài giữa khoá ạ, phần ví dụ đi nhanh quá nên em theo không kịp, làm bài tập cũng hay sai.` },
  { from: 'teacher', gapMin: 40, text: `Cảm ơn bạn đã nói thẳng. Bạn xem lại các bài ở chương giữa khoá và làm lại quiz chương đó nhé. Phần này nhiều bạn cũng vướng, mình sẽ bổ sung ví dụ chi tiết hơn.` },
  { from: 'student', gapMin: 180, text: `Dạ em cảm ơn ạ, em sẽ xem lại theo thứ tự đã gợi ý rồi báo kết quả ạ.` },
];

const stuck = (ten: string, khoa: string): Turn[] => [
  { from: 'teacher', gapMin: 0, text: `Chào ${ten}, mình thấy bạn đã dừng ở khoá "${khoa}" một thời gian rồi. Bạn có đang vướng ở bài nào không, mình giúp được gì không?` },
  { from: 'student', gapMin: 110, text: `Dạ em chào ạ. Dạo này em bận đi làm nên chưa học tiếp, với lại phần bài tập chương hai em làm mãi chưa ra ạ.` },
  { from: 'teacher', gapMin: 50, text: `Không sao bạn. Bạn xem lại video giải thích của chương hai trước, mỗi ngày học khoảng 20 phút là theo kịp. Có chỗ nào kẹt cụ thể bạn cứ nhắn mình.` },
  { from: 'student', gapMin: 160, text: `Dạ vâng, em cảm ơn ạ, em sẽ cố gắng học lại từ tuần này ạ.` },
];

const askRoadmap = (): Turn[] => [
  { from: 'student', gapMin: 0, text: `Chào ạ, em sắp học xong khoá rồi. Cho em hỏi sau khoá này em nên học tiếp gì để đi xa hơn ạ?` },
  { from: 'teacher', gapMin: 150, text: `Chào bạn, chúc mừng bạn sắp hoàn thành khoá. Bạn nên làm 1–2 dự án nhỏ để có sản phẩm đưa vào CV, sau đó học sâu hơn một mảng bạn thấy hợp nhất.` },
  { from: 'student', gapMin: 60, text: `Dạ vâng ạ. Vậy em nên làm dự án nhỏ ngay hay học thêm lý thuyết trước ạ?` },
  { from: 'teacher', gapMin: 120, text: `Bạn làm dự án nhỏ ngay, vướng chỗ nào thì quay lại học đúng chỗ đó. Học lý thuyết dàn trải lúc này dễ bị loãng.` },
  { from: 'student', gapMin: 45, text: `Em hiểu rồi ạ, em cảm ơn nhiều!` },
];

const askCertificate = (): Turn[] => [
  { from: 'student', gapMin: 0, text: `Em chào ạ, em hỏi khi hoàn thành 100% khoá thì có chứng chỉ không ạ? Em cần gửi cho công ty để xác nhận.` },
  { from: 'teacher', gapMin: 210, text: `Chào bạn, khi bạn hoàn thành toàn bộ bài học và bài kiểm tra, trang khoá học sẽ hiện chứng nhận hoàn thành để bạn tải về. Bạn còn mấy bài chưa xong trong chương cuối thôi.` },
  { from: 'student', gapMin: 75, text: `Dạ em cảm ơn ạ, em sẽ học nốt trong tuần này ạ.` },
];

const reportAudio = (): Turn[] => [
  { from: 'student', gapMin: 0, text: `Em chào ạ, video bài thứ ba của chương hai bị mất tiếng từ khoảng phút thứ 3 trở đi ạ. Em thử trình duyệt khác vẫn bị.` },
  { from: 'teacher', gapMin: 130, text: `Cảm ơn bạn đã báo. Mình kiểm tra thì thấy file tiếng bị lỗi khi xử lý, mình sẽ tải bản mới lên trong hôm nay. Trong lúc chờ, bạn xem phần ghi chú dưới bài để theo kịp nội dung nhé.` },
  { from: 'student', gapMin: 50, text: `Dạ vâng, em cảm ơn ạ.` },
  { from: 'student', gapMin: 20, text: `Cho em hỏi thêm: bài tập cuối chương này nộp muộn một ngày có bị trừ điểm không ạ?` },
];

const tenOf = (name: string) => name.trim().split(/\s+/).at(-1)!;

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Không chạy seed demo trên production');
  const prisma = new PrismaClient();
  try {
    // Khoá published có ghi danh trả phí: ưu tiên khoá có đánh giá <= 2 sao của người đã trả phí, rồi khoá nhiều người trả phí nhất.
    const [pick] = await prisma.$queryRawUnsafe<{ id: string }[]>(`
      SELECT c.id FROM courses c JOIN enrollments e ON e."courseId" = c.id AND e."orderId" IS NOT NULL
      WHERE c.status = 'published'
      GROUP BY c.id
      ORDER BY EXISTS (SELECT 1 FROM course_reviews r JOIN enrollments pe ON pe."courseId" = r."courseId" AND pe."userId" = r."userId" AND pe."orderId" IS NOT NULL
                       WHERE r."courseId" = c.id AND r.rating <= 2) DESC, COUNT(*) DESC, c.id
      LIMIT 1`);
    if (!pick) throw new Error('Chưa có khoá published nào có ghi danh trả phí (orderId) — không tạo đơn hàng trong seed này');
    const course = await prisma.course.findUniqueOrThrow({
      where: { id: pick.id }, select: { id: true, title: true, instructorId: true, instructor: { select: { email: true } } },
    });
    console.log(`Khoá: "${course.title}" — giảng viên ${course.instructor.email}`);

    const enr = await prisma.enrollment.findMany({
      where: { courseId: course.id, orderId: { not: null }, userId: { not: course.instructorId } },
      select: { progressPct: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: [{ progressPct: 'desc' }, { userId: 'asc' }],
    });

    const lowReviews = (await prisma.courseReview.findMany({
      where: { courseId: course.id, rating: { lte: 2 } }, select: { userId: true, rating: true }, orderBy: { createdAt: 'desc' },
    }));
    const lowIds = new Set(lowReviews.map((r) => r.userId));
    const low = enr.find((e) => lowIds.has(e.user.id));
    // Không có đánh giá thấp: giảng viên chủ động nhắn học viên tiến độ thấp nhất (đang kẹt).
    const opener = low ?? [...enr].reverse().find((e) => Number(e.progressPct) < 100);
    const rest = enr.filter((e) => e !== opener && Number(e.progressPct) < 100);
    const others = [...rest, ...enr.filter((e) => e !== opener && !rest.includes(e))].slice(0, opener ? 3 : 4);
    const scenarios = [askRoadmap, askCertificate, reportAudio, askRoadmap];
    const picks = [
      ...(opener ? [{ e: opener, turns: low ? lowRating(tenOf(opener.user.name), course.title, lowReviews.find((r) => r.userId === low.user.id)!.rating) : stuck(tenOf(opener.user.name), course.title), unread: false }] : []),
      ...others.map((e, i) => ({ e, turns: scenarios[i]!(), unread: i < 2 })), // 2 cuộc đầu: tin học viên cuối chưa đọc
    ];

    const now = Date.now();
    let created = 0;
    let skipped = 0;
    for (const [i, p] of picks.entries()) {
      const [userAId, userBId] = [course.instructorId, p.e.user.id].sort(); // nhỏ hơn = A, như app
      if (await prisma.conversation.findUnique({ where: { userAId_userBId: { userAId, userBId } }, select: { id: true } })) {
        skipped++;
        continue;
      }
      let t = now - (10 - i * 2) * DAY + 9 * HOUR; // cuộc sau bắt đầu gần đây hơn: 10, 8, 6, 4 ngày trước
      const msgs = p.turns.map((m) => ({
        senderId: m.from === 'teacher' ? course.instructorId : p.e.user.id,
        body: m.text,
        createdAt: new Date((t += m.gapMin * MIN)),
      }));
      const last = msgs.at(-1)!.createdAt;
      // Chưa đọc: mốc đọc của giảng viên dừng ngay trước tin cuối của học viên.
      const teacherRead = p.unread ? new Date(last.getTime() - 1) : last;
      const aIsTeacher = userAId === course.instructorId;
      await prisma.conversation.create({
        data: {
          userAId, userBId, lastMessageAt: last, createdAt: msgs[0]!.createdAt,
          aLastReadAt: aIsTeacher ? teacherRead : last,
          bLastReadAt: aIsTeacher ? last : teacherRead,
          messages: { create: msgs },
        },
      });
      created++;
      console.log(`  ${p.e.user.email}${p.unread ? ' (chưa đọc phía giảng viên)' : ''}`);
    }
    console.log(`✓ ${created} cuộc tin nhắn${skipped ? ` (bỏ qua ${skipped} cuộc đã có)` : ''}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
