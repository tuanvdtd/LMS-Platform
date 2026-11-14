import type { CourseCard } from '@/types/catalog';

// Khớp API back-end/src/profiles.
export const COVER_TONES = ['ink', 'blue', 'orange', 'violet', 'green', 'paper'] as const;
export type CoverTone = (typeof COVER_TONES)[number];

export const COVER_TONE_LABEL: Record<CoverTone, string> = {
  ink: 'Mực',
  blue: 'Xanh dương',
  orange: 'Cam',
  violet: 'Tím',
  green: 'Xanh lá',
  paper: 'Giấy',
};

interface LearningCourse {
  slug: string;
  title: string;
  thumbnailUrl: string;
  instructorName: string;
}

export interface PublicProfile {
  id: string;
  name: string;
  image: string | null;
  joinedAt: string;
  isInstructor: boolean;
  verified: boolean; // giảng viên cao cấp (đã qua duyệt đơn)
  headline: string | null;
  bio: string | null;
  coverTone: CoverTone;
  website: string | null;
  socials: { linkedin?: string; github?: string };
  teaching: { courses: CourseCard[]; studentCount: number } | null; // null: không phải giảng viên
  learningPublic: boolean;
  // null: chủ hồ sơ để riêng tư — server không gửi, không phải FE ẩn.
  learning: {
    inProgress: (LearningCourse & { progressPct: number })[];
    completed: (LearningCourse & { completedAt: string })[];
    certificates: { serialNo: string; courseTitle: string; courseSlug: string; issuedAt: string }[];
    skills: { slug: string; name: string; pct: number }[];
  } | null;
}

export interface MyProfile {
  headline: string | null;
  bio: string | null;
  coverTone: CoverTone;
  learningPublic: boolean;
  hasInstructorProfile: boolean;
}

export type UpdateProfilePayload = Partial<Omit<MyProfile, 'hasInstructorProfile'>>;
