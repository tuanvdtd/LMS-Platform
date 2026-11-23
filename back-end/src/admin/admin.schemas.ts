import { z } from 'zod';

export const USERS_PAGE_SIZE = 20;

export const usersQuery = z
  .object({
    q: z.string().trim().max(100).optional().transform((s) => s || undefined),
    role: z.enum(['all', 'student', 'instructor', 'verified']).default('all'),
    status: z.enum(['all', 'active', 'locked']).default('all'),
    page: z.coerce.number().int().min(1).default(1),
  })
  .strict();
export type UsersQuery = z.output<typeof usersQuery>;

export const lockUserSchema = z
  .object({
    reason: z.string().trim().min(5, 'Lý do tối thiểu 5 ký tự').max(500, 'Lý do tối đa 500 ký tự'),
    duration: z.enum(['7d', '30d', 'permanent']),
  })
  .strict();
export type LockUserInput = z.output<typeof lockUserSchema>;

export const overviewQuery = z.object({ range: z.enum(['7d', '30d', '90d']).default('30d') }).strict();
export type OverviewQuery = z.output<typeof overviewQuery>;
