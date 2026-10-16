import { CouponType } from '@prisma/client';
import { z } from 'zod';

export const createCouponSchema = z
  .object({
    code: z.string().trim().toUpperCase(),
    type: z.enum(CouponType),
    priceAmount: z.number().int().positive().optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    maxRedemptions: z.number().int().positive().max(100_000).optional(),
  })
  .strict();
export type CreateCouponInput = z.output<typeof createCouponSchema>;
