import type { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';
import type { Redis } from 'ioredis';
import { v7 as uuidv7 } from 'uuid';
import { optionalEnv, requireEnv } from '../env.js';
import { redisStorage } from '../infra/redis.js';
import type { MailService } from '../mail/mail.service.js';

export const AUTH = Symbol('AUTH');

// Better Auth mặc định chỉ biết 'admin' | 'user' → setRole('instructor') sẽ lỗi
// YOU_ARE_NOT_ALLOWED_TO_SET_NON_EXISTENT_VALUE nếu không khai báo ở đây.
const ac = createAccessControl(defaultStatements);
export const roles = {
  student: ac.newRole({}),
  instructor: ac.newRole({}),
  admin: ac.newRole({ ...adminAc.statements }),
};
export type Role = keyof typeof roles;

function oauth(prefix: 'GOOGLE' | 'GITHUB') {
  const clientId = optionalEnv(`${prefix}_CLIENT_ID`);
  const clientSecret = optionalEnv(`${prefix}_CLIENT_SECRET`);
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}

export function createAuth(
  prisma: PrismaClient,
  redis: Redis,
  mail: MailService,
) {
  const cookieDomain = optionalEnv('COOKIE_DOMAIN');
  const google = oauth('GOOGLE');
  const github = oauth('GITHUB');

  return betterAuth({
    baseURL: requireEnv('BETTER_AUTH_URL'),
    basePath: '/api/auth',
    secret: requireEnv('BETTER_AUTH_SECRET'),
    trustedOrigins: [requireEnv('FE_URL')],
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    // Redis là lớp đọc nhanh; bảng session vẫn là nguồn chính (spec §2).
    secondaryStorage: redisStorage(redis),
    session: { storeSessionInDatabase: true },
    advanced: {
      // Khớp UUID v7 của 40 bảng còn lại.
      database: { generateId: () => uuidv7() },
      crossSubDomainCookies: { enabled: !!cookieDomain, domain: cookieDomain },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      // Lộ mật khẩu → đặt lại là đá mọi phiên, kể cả kẻ gian.
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        void mail.sendResetPassword(user.email, url);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60 * 24,
      sendVerificationEmail: async ({ user, url }) => {
        void mail.sendVerification(user.email, url);
      },
    },
    // Provider thiếu key thì bỏ hẳn (dev có thể không cấu hình OAuth).
    socialProviders: {
      ...(google && { google }),
      ...(github && { github }),
    },
    user: {
      additionalFields: {
        targetTrack: { type: 'string', required: false },
        level: { type: 'string', required: false },
      },
    },
    rateLimit: {
      enabled: true, // mặc định Better Auth chỉ bật ở production
      storage: 'secondary-storage',
      // Mặc định /request-password-reset là 3 lần/60s → ~180 mail/giờ tới hộp thư người khác.
      customRules: {
        '/sign-up/email': { window: 600, max: 3 },
        '/request-password-reset': { window: 600, max: 3 },
      },
    },
    plugins: [
      admin({ ac, roles, defaultRole: 'student', adminRoles: ['admin'] }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth['$Infer']['Session'];
