-- CreateEnum
CREATE TYPE "Occupation" AS ENUM ('frontend_developer', 'backend_developer', 'fullstack_developer', 'mobile_developer', 'devops_engineer', 'data_engineer', 'data_analyst', 'ml_engineer', 'qa_engineer', 'software_architect', 'game_developer', 'other');

-- DropIndex
DROP INDEX "courses_status_track_level_idx";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "track";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "targetTrack",
ADD COLUMN     "occupation" "Occupation";

-- DropEnum
DROP TYPE "Track";

-- CreateTable
CREATE TABLE "occupation_topics" (
    "occupation" "Occupation" NOT NULL,
    "topicId" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "occupation_topics_pkey" PRIMARY KEY ("occupation","topicId")
);

-- CreateIndex
CREATE INDEX "occupation_topics_occupation_position_idx" ON "occupation_topics"("occupation", "position");

-- AddForeignKey
ALTER TABLE "occupation_topics" ADD CONSTRAINT "occupation_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

