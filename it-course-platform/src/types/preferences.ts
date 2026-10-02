import type { Ref, SkillLevel } from './instructor-course';

// Khớp enum Occupation ở back-end (spec 2026-10-02-personalize-occupation §3.1).
export const OCCUPATION_LABEL = {
  frontend_developer: 'Lập trình viên Frontend',
  backend_developer: 'Lập trình viên Backend',
  fullstack_developer: 'Lập trình viên Fullstack',
  mobile_developer: 'Lập trình viên Mobile',
  devops_engineer: 'Kỹ sư DevOps',
  data_engineer: 'Kỹ sư dữ liệu',
  data_analyst: 'Chuyên viên phân tích dữ liệu',
  ml_engineer: 'Kỹ sư học máy',
  qa_engineer: 'Kỹ sư kiểm thử (QA)',
  software_architect: 'Kiến trúc sư phần mềm',
  game_developer: 'Lập trình viên game',
  other: 'Nghề khác',
} as const;
export type Occupation = keyof typeof OCCUPATION_LABEL;

// all_levels là thuộc tính khoá, học viên chỉ chọn 3 mức. Label dùng SKILL_LEVEL_LABEL.
export const LEARNER_LEVELS = ['beginner', 'intermediate', 'advanced'] as const satisfies readonly SkillLevel[];
export type LearnerLevel = (typeof LEARNER_LEVELS)[number];

export interface Preferences {
  occupation: Occupation | null;
  level: LearnerLevel | null;
  topics: Ref[];
}

export interface UpdatePreferencesPayload {
  occupation?: Occupation | null;
  level?: LearnerLevel | null;
  topicIds?: string[];
}
