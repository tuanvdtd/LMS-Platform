-- ============================================================================
--  Bổ sung cho migration skill_assessment (dán vào cuối migration.sql).
--  Prisma không nhìn thấy 2 partial index dưới → đã thêm vào danh sách drift ở README + đầu sql/05.
-- ============================================================================

-- Mỗi học viên + topic chỉ 1 lượt đang làm: 2 request "Bắt đầu" song song → request sau P2002, service trả lượt của request trước.
CREATE UNIQUE INDEX uq_skill_attempt_in_progress ON skill_attempts ("userId", "topicId") WHERE status = 'in_progress';

-- Đếm câu đang dùng theo topic (topic mở khi ≥ 12 câu chưa ẩn).
CREATE INDEX idx_skill_questions_active ON skill_questions ("topicId") WHERE "archivedAt" IS NULL;
