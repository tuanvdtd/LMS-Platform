import { isStaff } from '../auth/auth.js';
import { COVER_TONES, type CoverTone } from './profiles.schemas.js';

type Own = { headline: string | null; bio: string | null; coverTone: string; website: string | null; socials: unknown };

// Tài khoản nghiệp vụ không học, không dạy → không có trang cá nhân. Bị khoá thì ẩn luôn.
export const isProfileVisible = (u: { role: string | null; banned: boolean | null }) => !u.banned && !isStaff(u.role);

// Một bộ chức danh / giới thiệu / liên kết cho mỗi tài khoản (user_profiles), học viên hay giảng viên đều vậy.
// Liên kết chỉ hiện khi đã xác minh: tài khoản mất xác minh thì link cũ không còn lộ ra.
export function shapeIdentity(own: Own | null, verified: boolean) {
  const tone = own?.coverTone as CoverTone | undefined;
  const socials = own?.socials;
  return {
    headline: own?.headline ?? null,
    bio: own?.bio ?? null,
    coverTone: tone && COVER_TONES.includes(tone) ? tone : 'ink',
    website: (verified && own?.website) || null,
    socials: verified && socials && typeof socials === 'object' && !Array.isArray(socials) ? socials : {},
    verified,
  };
}
