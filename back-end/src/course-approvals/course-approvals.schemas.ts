import { ApprovalStatus } from '@prisma/client';
import { z } from 'zod';

// spec pricing-submit-review §4.1, §5.1.
export const submitSchema = z
  .object({
    copyrightConfirmed: z.literal(true, 'Cần xác nhận cam kết bản quyền'),
    note: z
      .string()
      .trim()
      .max(1000, 'Tối đa 1000 ký tự')
      .optional()
      .transform((s) => s || null),
  })
  .strict();
export type SubmitInput = z.output<typeof submitSchema>;

export const approvalsQuery = z
  .object({
    status: z.enum(ApprovalStatus).default('pending'),
    page: z.coerce.number().int().min(1).default(1),
  })
  .strict();
export type ApprovalsQuery = z.output<typeof approvalsQuery>;

export const rejectSchema = z
  .object({ reason: z.string().trim().min(1, 'Nhập lý do từ chối').max(1000, 'Tối đa 1000 ký tự') })
  .strict();
export type RejectInput = z.output<typeof rejectSchema>;
