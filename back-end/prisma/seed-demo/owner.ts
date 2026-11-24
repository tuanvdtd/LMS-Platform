import type { PrismaClient } from '@prisma/client';
import { SHOWCASE } from './data/analytics-demo.ts';
import { DAY } from './rng.ts';

const HEADLINE = 'Kỹ sư phần mềm · Giảng dạy JavaScript và phát triển web';
const BIO =
  'Mình là kỹ sư phần mềm, làm chủ yếu với JavaScript và ứng dụng web. Trên Aolumi mình dạy những phần nền tảng mà người mới hay học lướt: ' +
  'kiểu dữ liệu, hàm, bất đồng bộ, cách trình duyệt dựng giao diện. Mỗi bài đều có ví dụ chạy được ngay và bài tập tự chấm để bạn biết mình ' +
  'hiểu tới đâu. Mình ưu tiên giải thích vì sao code chạy ra kết quả như vậy, để khi chuyển sang React hay Angular bạn không phải học thuộc cú pháp.';

// Tài khoản thật đứng tên khoá trình diễn (SEED_SHOWCASE_OWNER) phải là giảng viên đã xác minh như giảng viên seed mà nó thay.
// Chỉ thêm phần còn thiếu, không ghi đè thứ chủ tài khoản đã tự sửa. Tài khoản nhận tiền để chủ tài khoản tự nhập.
export async function ensureOwnerProfile(prisma: PrismaClient, userId: string, now: Date) {
  // Khoá trình diễn bán từ publishedDaysAgo ngày trước → tài khoản phải có từ trước đó, không thì hồ sơ ghi "Tham gia từ" sau ngày bán đầu tiên.
  const joinedBy = new Date(now.getTime() - (SHOWCASE.publishedDaysAgo + 60) * DAY);
  await prisma.user.updateMany({ where: { id: userId, createdAt: { gt: joinedBy } }, data: { createdAt: joinedBy } });
  await prisma.instructorProfile.upsert({
    where: { userId }, create: { userId, verifiedAt: new Date(joinedBy.getTime() + 20 * DAY) }, update: {},
  });
  const p = await prisma.userProfile.findUnique({ where: { userId }, select: { headline: true, bio: true } });
  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, headline: HEADLINE, bio: BIO },
    update: { headline: p?.headline ?? HEADLINE, bio: p?.bio ?? BIO },
  });
}
