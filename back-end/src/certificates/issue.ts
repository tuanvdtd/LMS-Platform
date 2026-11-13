import type { Prisma } from '@prisma/client';
import { newSerial } from './serial.js';

// Gọi trong transaction đang giữ khoá dòng enrollment. Trả mã số chứng chỉ vừa cấp. Mỗi học viên một chứng chỉ
// cho mỗi khoá: đã có thì trả null, nên hoàn thành lại không cấp lần hai.
export async function issueCertificate(tx: Prisma.TransactionClient, enrollmentId: string, now: Date): Promise<string | null> {
  const e = await tx.enrollment.findUniqueOrThrow({ where: { id: enrollmentId }, select: { userId: true, courseId: true } });
  const key = { userId: e.userId, courseId: e.courseId };
  if (await tx.certificate.findUnique({ where: { userId_courseId: key }, select: { id: true } })) return null;

  // Kiểm tra trùng bằng truy vấn trước khi tạo: bắt lỗi unique rồi thử lại sẽ làm hỏng transaction của PostgreSQL.
  let serialNo = newSerial();
  for (let i = 0; await tx.certificate.findUnique({ where: { serialNo }, select: { id: true } }); i++) {
    if (i >= 4) throw new Error('Không sinh được mã chứng chỉ chưa dùng');
    serialNo = newSerial();
  }
  await tx.certificate.create({ data: { ...key, serialNo, issuedAt: now } });
  return serialNo;
}
