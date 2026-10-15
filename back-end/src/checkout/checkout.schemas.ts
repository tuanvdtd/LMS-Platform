import { z } from 'zod';

export const checkoutSchema = z
  .object({ courseId: z.guid().optional(), couponCode: z.string().trim().max(20).optional() })
  .strict();
export type CheckoutInput = z.output<typeof checkoutSchema>;

export const enrollSchema = z.object({ couponCode: z.string().trim().max(20).optional() }).strict();
export type EnrollInput = z.output<typeof enrollSchema>;

export const idempotencyKey = z.uuid();
