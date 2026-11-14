import { z } from 'zod';
import { LINK } from '../instructor-applications/instructor-applications.schemas.js';

// Tông bìa trang /u/:id. FE có bảng màu cùng tên (globals.css: --cover-*).
export const COVER_TONES = ['ink', 'blue', 'orange', 'violet', 'green', 'paper'] as const;
export type CoverTone = (typeof COVER_TONES)[number];

// Ô để trống → null. Không cho link: hồ sơ công khai là chỗ dễ bị dùng để rải spam.
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Tối đa ${max} ký tự`)
    .refine((s) => !LINK.test(s), 'Không được chứa link')
    .transform((s) => s || null)
    .nullable();

// Ô liên kết: trống → null, có thì phải là http(s). Chỉ giảng viên đã xác minh được gửi (service kiểm).
const url = z
  .union([z.literal('').transform(() => null), z.httpUrl('Link không hợp lệ').max(200, 'Tối đa 200 ký tự')])
  .nullable();

// PATCH /me/profile: gửi trường nào sửa trường đó. socials gửi là thay cả cụm; ô trống bị bỏ khỏi object.
export const updateProfileSchema = z
  .object({
    headline: text(60),
    bio: text(2000),
    coverTone: z.enum(COVER_TONES, 'Tông bìa không hợp lệ'),
    learningPublic: z.boolean(),
    website: url,
    socials: z
      .object({ linkedin: url, github: url })
      .partial()
      .strict()
      .transform((s) => Object.fromEntries(Object.entries(s).filter(([, v]) => v))),
  })
  .partial()
  .strict();
export type UpdateProfileInput = z.output<typeof updateProfileSchema>;
