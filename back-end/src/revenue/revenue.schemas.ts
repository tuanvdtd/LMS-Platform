import { z } from 'zod';
import { normalizeAccountName } from './bank.js';

const PERIOD = /^[0-9]{4}-(0[1-9]|1[0-2])$/;
const page = z.coerce.number().int().min(1).default(1);

export const payoutAccountSchema = z
  .object({
    bankBin: z.string().regex(/^[0-9]{6}$/, 'Chọn ngân hàng'),
    bankAccountNo: z.string().regex(/^[0-9]{6,19}$/, 'Số tài khoản gồm 6–19 chữ số'),
    bankAccountName: z
      .string()
      .transform(normalizeAccountName)
      .pipe(z.string().regex(/^[A-Z ]{2,50}$/, 'Tên chủ tài khoản chỉ gồm chữ cái, 2–50 ký tự')),
  })
  .strict();
export type PayoutAccountInput = z.output<typeof payoutAccountSchema>;

export const sharePctSchema = z.object({ sharePct: z.number().int().min(0).max(100) }).strict();
export type SharePctInput = z.output<typeof sharePctSchema>;

export const closePeriodSchema = z.object({ period: z.string().regex(PERIOD, 'Kỳ dạng YYYY-MM') }).strict();
export type ClosePeriodInput = z.output<typeof closePeriodSchema>;

export const markPaidSchema = z
  .object({ bankTxnRef: z.string().trim().max(64).optional().transform((s) => s || null) })
  .strict();
export type MarkPaidInput = z.output<typeof markPaidSchema>;

export const pageQuery = z.object({ page }).strict();
export type PageQuery = z.output<typeof pageQuery>;

export const adminPayoutsQuery = z
  .object({
    page,
    status: z.enum(['pending', 'paid']).optional(),
    period: z.string().regex(PERIOD, 'Kỳ dạng YYYY-MM').optional(),
  })
  .strict();
export type AdminPayoutsQuery = z.output<typeof adminPayoutsQuery>;

const optionalUrl = z.url('Link không hợp lệ').max(200, 'Tối đa 200 ký tự').optional();

// POST /instructor/premium: tạo instructor_profiles kèm tài khoản nhận tiền.
export const premiumSchema = z
  .object({
    headline: z.string().trim().min(1, 'Nhập chuyên môn').max(60, 'Tối đa 60 ký tự'),
    bio: z
      .string()
      .trim()
      .max(2000, 'Tối đa 2000 ký tự')
      .optional()
      .transform((s) => s || null),
    socials: z.object({ linkedin: optionalUrl, github: optionalUrl }).strict().default({}),
    bank: payoutAccountSchema,
    agreeTerms: z.literal(true, 'Cần đồng ý điều khoản chia doanh thu'),
  })
  .strict();
export type PremiumInput = z.output<typeof premiumSchema>;
