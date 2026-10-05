import { z } from 'zod';
import { PDF_MAX_BYTES, PROMO_MAX_BYTES, THUMBNAIL_MAX_BYTES, VIDEO_MAX_BYTES } from './file-check.js';

// spec curriculum-upload §4.3, video-upload §4.3. kind lạ → 400.
const fileName = z.string().trim().min(1).max(255);
const mp4 = z.literal('video/mp4', 'Chỉ nhận video MP4');

export const createUploadSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('document'),
      fileName,
      mimeType: z.literal('application/pdf', 'Chỉ nhận file PDF'),
      sizeBytes: z.int().min(1).max(PDF_MAX_BYTES, 'PDF tối đa 1 GB'),
    })
    .strict(),
  z
    .object({
      kind: z.literal('thumbnail'),
      fileName,
      mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp'], 'Chỉ nhận ảnh JPG, PNG hoặc WebP'),
      sizeBytes: z.int().min(1).max(THUMBNAIL_MAX_BYTES, 'Ảnh tối đa 5 MB'),
    })
    .strict(),
  z
    .object({
      kind: z.literal('video'),
      fileName,
      mimeType: mp4,
      sizeBytes: z.int().min(1).max(VIDEO_MAX_BYTES, 'Video tối đa 1 GB'),
      // Thời lượng lấy từ FE (video.duration), server không đo — spec video-upload V5.
      durationSec: z.int('Thiếu thời lượng video').min(0, 'Thời lượng video không hợp lệ').max(24 * 3600, 'Video tối đa 24 giờ'),
    })
    .strict(),
  z
    .object({
      kind: z.literal('promo'),
      fileName,
      mimeType: mp4,
      sizeBytes: z.int().min(1).max(PROMO_MAX_BYTES, 'Video giới thiệu tối đa 200 MB'),
    })
    .strict(),
]);
export type CreateUploadInput = z.output<typeof createUploadSchema>;

export const libraryQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  kind: z.enum(['document', 'video']).default('document'),
});
export type LibraryQuery = z.output<typeof libraryQuerySchema>;
