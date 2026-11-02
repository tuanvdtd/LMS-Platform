import { z } from 'zod';

export const BIO_MIN_WORDS = 50;
// Như Udemy: giới thiệu không chứa link (link để ở các ô mạng xã hội).
const LINK = /https?:\/\/|\bwww\./i;

export const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

const optionalUrl = z.httpUrl('Link không hợp lệ').max(200, 'Tối đa 200 ký tự').optional();

// PUT /instructor/application/info. Lưu đè cả bước: ô bỏ trống → null.
export const infoSchema = z
  .object({
    name: z.string().trim().min(2, 'Họ tên 2–60 ký tự').max(60, 'Họ tên 2–60 ký tự'),
    headline: z.string().trim().min(1, 'Nhập chức danh').max(60, 'Tối đa 60 ký tự'),
    bio: z
      .string()
      .trim()
      .max(2000, 'Tối đa 2000 ký tự')
      .refine((s) => wordCount(s) >= BIO_MIN_WORDS, `Giới thiệu tối thiểu ${BIO_MIN_WORDS} từ`)
      .refine((s) => !LINK.test(s), 'Giới thiệu không được chứa link'),
    website: optionalUrl,
    socials: z.object({ linkedin: optionalUrl, github: optionalUrl }).strict().default({}),
  })
  .strict();
export type InfoInput = z.output<typeof infoSchema>;

export const termsSchema = z.object({ accepted: z.literal(true, 'Cần đồng ý điều khoản') }).strict();

// Admin không thấy đơn nháp.
export const applicationsQuery = z
  .object({
    status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
    page: z.coerce.number().int().min(1).default(1),
  })
  .strict();
export type ApplicationsQuery = z.output<typeof applicationsQuery>;

export const rejectSchema = z
  .object({ reason: z.string().trim().min(1, 'Nhập lý do từ chối').max(500, 'Tối đa 500 ký tự') })
  .strict();
export type RejectInput = z.output<typeof rejectSchema>;
