// Khớp API back-end/src/instructor-courses (spec 2026-09-30-course-create-basics §4.2).
// Khoá của map nhãn = giá trị enum trong DB.
export const COURSE_STATUS_LABEL = {
  draft: 'Bản nháp',
  in_review: 'Chờ duyệt',
  published: 'Đang bán',
  unpublished: 'Đã gỡ',
} as const;
export type CourseStatus = keyof typeof COURSE_STATUS_LABEL;

export const SKILL_LEVEL_LABEL = {
  all_levels: 'Mọi cấp độ',
  beginner: 'Mới bắt đầu',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
} as const;
export type SkillLevel = keyof typeof SKILL_LEVEL_LABEL;

export const LANGUAGE_LABEL = { vi: 'Tiếng Việt', en: 'Tiếng Anh' } as const;
export type CourseLanguage = keyof typeof LANGUAGE_LABEL;

export interface Ref {
  id: string;
  slug: string;
  name: string;
}

export type CourseTopic = Ref & { isPrimary: boolean };

export type ChecklistKey = 'goals' | 'curriculum' | 'basics';

export interface ChecklistItem {
  key: ChecklistKey;
  done: boolean;
  missing: { message: string; anchor: string }[];
}

export interface CourseDetail {
  id: string;
  slug: string;
  status: CourseStatus;
  title: string;
  subtitle: string | null;
  description: string | null;
  language: CourseLanguage;
  level: SkillLevel | null;
  thumbnailUrl: string | null;
  promoVideoUrl: string | null;
  learningObjectives: string[];
  requirements: string[];
  targetAudience: string[];
  category: (Ref & { parent: Ref | null }) | null;
  topics: CourseTopic[]; // chủ đề chính đứng đầu
  updatedAt: string;
  checklist: ChecklistItem[];
}

export interface CourseListItem {
  id: string;
  title: string;
  status: CourseStatus;
  thumbnailUrl: string | null;
  updatedAt: string;
  progress: { done: number; total: number };
}

// PATCH: chỉ gửi trường muốn đổi. subtitle/description chuỗi rỗng → BE lưu null.
export interface UpdateCoursePayload {
  title?: string;
  subtitle?: string;
  description?: string;
  language?: CourseLanguage;
  level?: SkillLevel | null;
  categoryId?: string | null;
  topics?: { id: string; isPrimary: boolean }[];
  learningObjectives?: string[];
  requirements?: string[];
  targetAudience?: string[];
}
