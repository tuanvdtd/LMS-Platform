-- AlterTable
ALTER TABLE "courses" DROP COLUMN "congratsMessage",
DROP COLUMN "welcomeMessage",
ALTER COLUMN "categoryId" DROP NOT NULL,
ALTER COLUMN "track" DROP NOT NULL,
ALTER COLUMN "level" DROP NOT NULL;
