import { isStaff } from '../auth/auth.js';
import { COVER_TONES, type CoverTone } from './profiles.schemas.js';

type Own = { headline: string | null; bio: string | null; coverTone: string };
type Instructor = { headline: string | null; bio: string | null; website: string | null; socials: unknown };

// Tài khoản nghiệp vụ không học, không dạy → không có trang cá nhân. Bị khoá thì ẩn luôn.
export const isProfileVisible = (u: { role: string | null; banned: boolean | null }) => !u.banned && !isStaff(u.role);

// Một headline, một bio cho mỗi người: giảng viên cao cấp dùng bản đã qua duyệt đơn (instructor_profiles),
// người khác dùng bản tự nhập (user_profiles). Tông bìa luôn là lựa chọn của người dùng.
export function shapeIdentity(own: Own | null, instructor: Instructor | null) {
  const tone = own?.coverTone as CoverTone | undefined;
  const socials = instructor?.socials;
  return {
    headline: (instructor ? instructor.headline : own?.headline) ?? null,
    bio: (instructor ? instructor.bio : own?.bio) ?? null,
    coverTone: tone && COVER_TONES.includes(tone) ? tone : 'ink',
    website: instructor?.website ?? null,
    socials: socials && typeof socials === 'object' && !Array.isArray(socials) ? socials : {},
    verified: !!instructor,
  };
}
