import { z } from 'zod';

export const NUDGE_MAX_RECIPIENTS = 50;
export const NUDGE_MAX_CHARS = 500;
const unique = (a: string[]) => new Set(a).size === a.length;

export const nudgeSchema = z
  .object({
    userIds: z.array(z.guid()).min(1).max(NUDGE_MAX_RECIPIENTS).refine(unique, 'Danh sách học viên bị trùng'),
    kind: z.enum(['reminder', 'encourage']),
    message: z.string().trim().min(1, 'Nhập lời nhắn').max(NUDGE_MAX_CHARS, `Lời nhắn tối đa ${NUDGE_MAX_CHARS} ký tự`),
  })
  .strict();
export type NudgeInput = z.infer<typeof nudgeSchema>;

// Danh sách học viên: lọc theo mức nguy cơ + phân trang (trang vượt quá → về trang cuối, ở service).
export const STUDENT_PAGE_SIZE = 20;
export const studentsQuery = z
  .object({
    level: z.enum(['all', 'high', 'watch', 'ok', 'new', 'done']).default('all'),
    page: z.coerce.number().int().min(1).default(1),
  })
  .strict();
export type StudentsQuery = z.output<typeof studentsQuery>;

export const courseViewSchema = z.object({ visitorId: z.guid('Mã khách không hợp lệ') }).strict();
export type CourseViewInput = z.output<typeof courseViewSchema>;

export const revenueQuery = z.object({ range: z.enum(['30d', '12m']).default('12m') });
export type RevenueQuery = z.output<typeof revenueQuery>;
export const funnelQuery = z.object({ days: z.coerce.number().pipe(z.union([z.literal(7), z.literal(30), z.literal(90)])).default(30) });
export type FunnelQuery = z.output<typeof funnelQuery>;
