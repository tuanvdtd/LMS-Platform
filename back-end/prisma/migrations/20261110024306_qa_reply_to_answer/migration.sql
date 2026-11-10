-- Hỏi đáp: nhớ bình luận đang được trả lời (bấm "@Tên" cuộn tới) + thông báo giảng viên khi có câu hỏi mới.
-- Đã bỏ các DROP INDEX uq_*_position Prisma tự sinh: đó là unique DEFERRABLE viết tay, phải giữ.

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'qa_question';

-- AlterTable
ALTER TABLE "course_answers" ADD COLUMN     "replyToAnswerId" UUID;

-- CreateIndex
CREATE INDEX "course_answers_replyToAnswerId_idx" ON "course_answers"("replyToAnswerId");

-- AddForeignKey
ALTER TABLE "course_answers" ADD CONSTRAINT "course_answers_replyToAnswerId_fkey" FOREIGN KEY ("replyToAnswerId") REFERENCES "course_answers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
