-- Quiz / bài code không còn tính mastery topic (PRODUCT.md); mất dữ liệu 3 bảng — đã được duyệt.

-- DropForeignKey
ALTER TABLE "exercise_topics" DROP CONSTRAINT "exercise_topics_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "exercise_topics" DROP CONSTRAINT "exercise_topics_topicId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_topics" DROP CONSTRAINT "quiz_topics_quizId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_topics" DROP CONSTRAINT "quiz_topics_topicId_fkey";

-- DropForeignKey
ALTER TABLE "user_topic_mastery" DROP CONSTRAINT "user_topic_mastery_topicId_fkey";

-- DropForeignKey
ALTER TABLE "user_topic_mastery" DROP CONSTRAINT "user_topic_mastery_userId_fkey";

-- DropTable
DROP TABLE "exercise_topics";

-- DropTable
DROP TABLE "quiz_topics";

-- DropTable
DROP TABLE "user_topic_mastery";

