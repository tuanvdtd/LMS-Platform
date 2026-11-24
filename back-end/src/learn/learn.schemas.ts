import { z } from 'zod';
import { SEGMENTS_MAX } from './clamp-segments.js';

export const NOTE_MAX = 1000;
const noteBody = z
  .string()
  .trim()
  .min(1, 'Ghi chú đang trống')
  .max(NOTE_MAX, `Ghi chú tối đa ${NOTE_MAX} ký tự`)
  // Postgres text không nhận 0x00.
  .refine((s) => !s.includes('\u0000'), 'Ghi chú chứa ký tự không hợp lệ');

export const lastItemSchema = z.object({ itemId: z.guid('Bài học không hợp lệ') }).strict();
export type LastItemInput = z.output<typeof lastItemSchema>;

// Vị trí xem dở của video (giây), để học tiếp; kèm các đoạn đã xem từ lần gửi trước (dashboard giữ chân video).
const watchSegment = z
  .object({ s: z.int().min(0).max(24 * 3600), e: z.int().min(1).max(24 * 3600) })
  .strict()
  .refine((x) => x.s < x.e, 'Đoạn xem không hợp lệ');
export const progressSchema = z
  .object({
    positionSec: z.int().min(0).max(24 * 3600),
    viewId: z.guid('Mã lượt xem không hợp lệ').optional(),
    segments: z.array(watchSegment).max(SEGMENTS_MAX).optional(),
  })
  .strict()
  .refine((x) => !x.segments?.length || !!x.viewId, { message: 'Thiếu mã lượt xem', path: ['viewId'] });
export type ProgressInput = z.output<typeof progressSchema>;

export const createNoteSchema = z.object({ positionSec: z.int().min(0).max(24 * 3600), body: noteBody }).strict();
export type CreateNoteInput = z.output<typeof createNoteSchema>;

export const updateNoteSchema = z.object({ body: noteBody }).strict();
export type UpdateNoteInput = z.output<typeof updateNoteSchema>;
