import type { Occupation } from '@prisma/client';

export type Lang = 'vi' | 'en';
export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseLevel = UserLevel | 'all_levels';
// 'rejected' là khoá draft từng bị từ chối: DB lưu status = draft + course_approvals rejected.
export type SeedStatus = 'published' | 'draft' | 'in_review' | 'rejected';

export type SeedProfile = {
  headline: string;
  bio: string;
  website: string;
  socials: { github?: string; linkedin?: string };
  bank: { bin: string; accountNo: string; accountName: string };
};

export type SeedUser = {
  name: string;
  email: string;
  occupation: Occupation;
  level: UserLevel;
  targetTopics: string[];
  // Có profile = giảng viên đã xác minh (bán được khoá có phí).
  profile?: SeedProfile;
};

export type SeedOption = { content: string; correct?: true; explanation: string };

export type SeedQuestion = {
  type: 'single_choice' | 'multiple_choice';
  stem: string;
  // Chỉ số bài giảng (0-based) theo thứ tự toàn khoá.
  relatedLecture: number;
  options: SeedOption[];
};

export type SeedExercise = {
  title: string;
  learningObjective: string;
  instructions: string;
  hints: string[];
  solutionExplanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  relatedLecture: number;
  code: { language: 'javascript' | 'python'; starter: string; solution: string }[];
  tests: { input: string; expectedOutput: string; isPublic: boolean }[];
};

export type SeedCourse = {
  instructorEmail: string;
  categorySlug: string;
  topics: { slug: string; primary?: true }[];
  language: Lang;
  level: CourseLevel;
  priceAmount: number;
  status: SeedStatus;
  rejectReason?: string;
  title: string;
  subtitle: string;
  description: string;
  learningObjectives: string[];
  requirements: string[];
  targetAudience: string[];
  thumbnail: { label: string; tagline: string };
  sections: { title: string; lectures: string[] }[];
  quiz: { title: string; description: string; questions: SeedQuestion[] };
  exercise?: SeedExercise;
};

export type SeedData = { users: SeedUser[]; courses: SeedCourse[] };
