// Cấp chứng chỉ cho các lượt ghi danh đã hoàn thành từ trước khi có tính năng. Chạy lại không tạo trùng.
// Không tạo thông báo: học viên không cần được báo về một việc đã xong từ lâu.
import prismaPkg from '@prisma/client';
import { newSerial } from '../src/certificates/serial.ts';

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

try {
  const done = await prisma.enrollment.findMany({
    where: { completedAt: { not: null } },
    select: { userId: true, courseId: true, completedAt: true },
  });
  const have = new Set(
    (await prisma.certificate.findMany({ select: { userId: true, courseId: true } })).map((c) => `${c.userId}:${c.courseId}`),
  );
  const missing = done.filter((e) => !have.has(`${e.userId}:${e.courseId}`));
  // skipDuplicates: lỡ trùng mã số (xác suất gần 0) thì bỏ dòng đó, lần chạy sau sẽ tạo lại.
  const { count } = await prisma.certificate.createMany({
    data: missing.map((e) => ({ userId: e.userId, courseId: e.courseId, serialNo: newSerial(), issuedAt: e.completedAt! })),
    skipDuplicates: true,
  });
  console.log(`Đã hoàn thành: ${done.length} lượt ghi danh. Tạo mới ${count} chứng chỉ.`);
} finally {
  await prisma.$disconnect();
}
