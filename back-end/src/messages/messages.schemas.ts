import { z } from 'zod';
import { BODY_MAX, IMAGE_MIME, IMAGE_MAX_BYTES, IMAGES_MAX } from './messages-rules.js';

// Chữ thường để khớp uuid Prisma trả về (orderPair so chuỗi).
const uuid = z.guid().transform((s) => s.toLowerCase());
export const conversationId = uuid;
export const userIdParam = uuid;
export const openConversationBody = z.object({ userId: uuid });
export const listConversationsQuery = z.object({
  cursor: z.string().regex(/^\d{4}-\d\d-\d\dT[\d:.]+Z\|[0-9a-f-]{36}$/i).optional(),
  q: z.string().trim().max(100).optional(),
});
export const listMessagesQuery = z.object({ before: uuid.optional() });
export const sendMessageBody = z
  .object({
    body: z.string().max(BODY_MAX * 2).transform((s) => s.trim()).pipe(z.string().max(BODY_MAX, `Tin nhắn tối đa ${BODY_MAX} ký tự`)),
    imageKeys: z.array(z.string().max(200)).max(IMAGES_MAX, `Tối đa ${IMAGES_MAX} ảnh`).default([]),
  })
  .refine((v) => v.body.length > 0 || v.imageKeys.length > 0, 'Tin nhắn trống');
export const imageUploadBody = z.object({
  mimeType: z.enum(IMAGE_MIME, 'Chỉ nhận ảnh JPG, PNG hoặc WebP'),
  sizeBytes: z.number().int().positive().max(IMAGE_MAX_BYTES, 'Ảnh tối đa 5 MB'),
});
export type ListConversationsQuery = z.output<typeof listConversationsQuery>;
export type SendMessageBody = z.output<typeof sendMessageBody>;
export type ImageUploadBody = z.output<typeof imageUploadBody>;
