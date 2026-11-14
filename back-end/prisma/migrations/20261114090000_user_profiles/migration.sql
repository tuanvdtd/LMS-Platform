-- Hồ sơ công khai /u/:id: chức danh, giới thiệu, tông bìa, công tắc công khai phần học tập.

-- CreateTable
CREATE TABLE "user_profiles" (
    "userId" UUID NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "coverTone" TEXT NOT NULL DEFAULT 'ink',
    "learningPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
