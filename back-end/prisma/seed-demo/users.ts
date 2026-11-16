import { hashPassword } from 'better-auth/crypto';
import { v7 as uuidv7 } from 'uuid';
import type { Occupation, PrismaClient } from '@prisma/client';
import type { SeedUser } from './data/types.ts';
import { DAY, int, type Rng } from './rng.ts';

export const DEMO_PASSWORD = 'SkillPath@2026';

export type SeededUser = { id: string; email: string; createdAt: Date; verifiedAt: Date | null; occupation: Occupation; topicIds: string[] };

export async function writeUsers(
  prisma: PrismaClient,
  users: SeedUser[],
  ctx: { rng: Rng; now: Date; instructorEmails: Set<string>; topicIdBySlug: Map<string, string>; occupationTopicIds: Map<Occupation, string[]> },
): Promise<Map<string, SeededUser>> {
  // Băm một lần rồi dùng chung: cùng một mật khẩu demo, scrypt đủ chậm để 40 lần băm thành chờ lâu.
  const hash = await hashPassword(DEMO_PASSWORD);
  const rows = users.map((u) => {
    const teaches = ctx.instructorEmails.has(u.email);
    // Người dạy tham gia sớm hơn để có thời gian xây khoá trước khi xuất bản.
    const createdAt = new Date(ctx.now.getTime() - int(ctx.rng, teaches ? 300 : 20, teaches ? 365 : 330) * DAY);
    const verifiedAt = u.profile ? new Date(createdAt.getTime() + int(ctx.rng, 5, 30) * DAY) : null;
    return { u, id: uuidv7(), createdAt, verifiedAt };
  });
  await prisma.$transaction(async (tx) => {
    await tx.user.createMany({
      data: rows.map(({ u, id, createdAt }) => ({
        id, name: u.name, email: u.email, emailVerified: true, role: 'student,instructor',
        occupation: u.occupation, level: u.level, createdAt, updatedAt: createdAt,
      })),
    });
    await tx.account.createMany({
      data: rows.map(({ id, createdAt }) => ({ id: uuidv7(), accountId: id, providerId: 'credential', password: hash, userId: id, createdAt, updatedAt: createdAt })),
    });
    await tx.instructorProfile.createMany({
      data: rows.filter((r) => r.u.profile).map(({ u, id, verifiedAt }) => ({
        userId: id,
        bankBin: u.profile!.bank.bin, bankAccountNo: u.profile!.bank.accountNo, bankAccountName: u.profile!.bank.accountName,
        verifiedAt: verifiedAt!,
      })),
    });
    await tx.userProfile.createMany({
      data: rows.filter((r) => r.u.profile).map(({ u, id, verifiedAt }) => ({
        userId: id, headline: u.profile!.headline, bio: u.profile!.bio, website: u.profile!.website, socials: u.profile!.socials,
        updatedAt: verifiedAt!,
      })),
    });
    await tx.userTargetTopic.createMany({
      data: rows.flatMap(({ u, id, createdAt }) => u.targetTopics.map((slug) => ({ userId: id, topicId: ctx.topicIdBySlug.get(slug)!, createdAt }))),
    });
  });
  return new Map(rows.map(({ u, id, createdAt, verifiedAt }) => [u.email, {
    id, email: u.email, createdAt, verifiedAt, occupation: u.occupation,
    topicIds: [...new Set([...(ctx.occupationTopicIds.get(u.occupation) ?? []), ...u.targetTopics.map((s) => ctx.topicIdBySlug.get(s)!)])],
  }]));
}
