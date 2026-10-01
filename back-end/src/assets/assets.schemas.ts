import { z } from 'zod';
import { PDF_MAX_BYTES, THUMBNAIL_MAX_BYTES } from './file-check.js';

// spec curriculum-upload §4.3. kind lạ (vd 'video' trước đợt 3) → 400.
const fileName = z.string().trim().min(1).max(255);

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
]);
export type CreateUploadInput = z.output<typeof createUploadSchema>;

export const libraryQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
});
export type LibraryQuery = z.output<typeof libraryQuerySchema>;
