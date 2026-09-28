export type Track = 'frontend' | 'backend' | 'fullstack' | 'data' | 'devops' | 'mobile';

export type CourseLevel = 'beginner' | 'basic' | 'intermediate' | 'advanced';

export type CourseStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'hidden';

export type LessonType = 'video' | 'reading' | 'quiz' | 'coding' | 'attachment';

export type Verdict = 'AC' | 'WA' | 'TLE' | 'RE' | 'CE' | 'Pending' | 'Running';

export interface SkillTag {
  id: string;
  name: string;
  track: Track;
}

export interface SkillMastery {
  skillId: string;
  skillName: string;
  mastery: number; // 0-100
  track: Track;
  trend: 'up' | 'down' | 'stable';
  quizzesCompleted: number;
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  title: string;
  rating: number;
  studentCount: number;
  courseCount: number;
  bio: string;
  verified: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration?: number; // seconds
  preview: boolean;
  completed?: boolean;
  quizId?: string;
  problemId?: string;
}

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  previewVideo?: string;
  track: Track;
  level: CourseLevel;
  instructor: Instructor;
  rating: number;
  ratingCount: number;
  studentCount: number;
  price: number;
  originalPrice: number;
  status: CourseStatus;
  updatedAt: string;
  language: string;
  duration: number; // total hours
  quizCount: number;
  codeCount: number;
  hasCertificate: boolean;
  skills: SkillTag[];
  prerequisites: SkillTag[];
  learningOutcomes: string[];
  curriculum: Chapter[];
  tags: string[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  goal: Track;
  level: CourseLevel;
  skills: SkillMastery[];
  enrolledCourses: string[];
  completedCourses: string[];
  joinedAt: string;
}

export interface QuizQuestion {
  id: string;
  content: string;
  type: 'single' | 'multiple';
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
  skills: SkillTag[];
  difficultySet: number;
  difficultyActual?: number;
  discriminationIndex?: number;
}

export interface Quiz {
  id: string;
  title: string;
  courseId: string;
  timeLimit: number; // seconds
  passingScore: number;
  maxAttempts: number;
  questions: QuizQuestion[];
  skills: SkillTag[];
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  hidden: boolean;
  weight: number;
}

export interface CodingProblem {
  id: string;
  title: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  timeLimit: number; // ms
  memoryLimit: number; // MB
  skills: SkillTag[];
  languages: string[];
  starterCode: Record<string, string>;
  testCases: TestCase[];
  acceptanceRate: number;
}

export interface Submission {
  id: string;
  problemId: string;
  language: string;
  verdict: Verdict;
  score: number;
  passedTests: number;
  totalTests: number;
  runtime?: number;
  memory?: number;
  submittedAt: string;
}

export interface RecommendationReason {
  type: 'skill_gap' | 'goal' | 'prerequisite_met' | 'collaborative' | 'similar';
  label: string;
  detail: string;
}

export interface RecommendedCourse extends Course {
  reason: RecommendationReason;
}
