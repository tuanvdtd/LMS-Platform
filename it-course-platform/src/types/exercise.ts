import type { Verdict } from '@/types';

// Khớp API back-end/src/exercise (spec 2026-10-19-coding-exercise §6–§7). Giới hạn giống BE.
export const LANGUAGES = { javascript: 'JavaScript', python: 'Python', cpp: 'C++' } as const;
export type Language = keyof typeof LANGUAGES;
export const LANGUAGE_IDS = Object.keys(LANGUAGES) as Language[];

export const MAX_TESTS = 20;
export const MAX_IO_BYTES = 64 * 1024;
export const MAX_CODE_BYTES = 64 * 1024;
export const MAX_HINTS = 5;
export const MAX_HINT = 500;
export const MAX_INSTRUCTIONS = 20_000;
export const MAX_OBJECTIVE = 200;
export const MAX_SOLUTION_EXPLANATION = 5000;
export const TIME_LIMIT_MS = { min: 500, max: 10_000 } as const;
export const MEMORY_LIMIT_KB = { min: 32_000, max: 512_000 } as const;

export type Difficulty = 'easy' | 'medium' | 'hard';
export type SubmissionStatus =
  | 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'time_limit_exceeded'
  | 'runtime_error' | 'compile_error' | 'internal_error';

export interface ExerciseTest {
  id: string;
  position: number;
  input: string;
  expectedOutput: string;
  isPublic: boolean;
  points: number;
}
export interface StarterCode {
  language: Language;
  code: string;
  solutionCode: string | null;
}
export interface ExerciseDetail {
  title: string;
  isPublished: boolean;
  instructions: string;
  hints: string[];
  difficulty: Difficulty;
  learningObjective: string | null;
  solutionExplanation: string | null;
  relatedItemId: string | null;
  topicIds: string[];
  languages: Language[];
  timeLimitMs: number;
  memoryLimitKb: number;
  updatedAt: string;
  starters: StarterCode[];
  tests: ExerciseTest[];
}
export type UpdateExercisePayload = Partial<
  Pick<ExerciseDetail, 'instructions' | 'hints' | 'difficulty' | 'learningObjective' | 'solutionExplanation' | 'relatedItemId' | 'topicIds'>
>;
export interface UpdateCodePayload {
  languages: Language[];
  timeLimitMs: number;
  memoryLimitKb: number;
  starters: StarterCode[];
  tests: { id?: string; input: string; expectedOutput: string; isPublic: boolean; points: number }[];
}
export interface ExerciseMutation {
  exercise: ExerciseDetail;
}
export interface VerifyReport {
  passed: boolean;
  problems: string[];
  languages: {
    language: Language;
    compileError: string | null;
    tests: { testCaseId: string; status: SubmissionStatus; stdout: string; timeMs: number | null }[];
  }[];
}

export interface LearnExercise {
  itemId: string;
  title: string;
  instructions: string;
  difficulty: Difficulty;
  learningObjective: string | null;
  timeLimitMs: number;
  memoryLimitKb: number;
  topics: { id: string; name: string }[];
  relatedItem: { id: string; title: string } | null;
  languages: Language[];
  starters: Partial<Record<Language, string>>;
  publicTests: { id: string; input: string; expectedOutput: string }[];
  hiddenTestCount: number;
  hints: string[];
  completed: boolean;
  bestScore: number | null;
  solution: { codes: Partial<Record<Language, string>>; explanation: string | null } | null;
}
export interface CodePayload {
  language: Language;
  sourceCode: string;
}
export interface RunResult {
  compileError: string | null;
  tests: {
    testCaseId: string;
    input: string;
    expectedOutput: string;
    stdout: string;
    stderr: string;
    status: SubmissionStatus;
    timeMs: number | null;
  }[];
}
export interface SubmissionSummary {
  id: string;
  language: Language;
  status: SubmissionStatus;
  score: number;
  passedTests: number;
  totalTests: number;
  submittedAt: string;
  gradedAt: string | null;
}
export type SubmissionTestResult =
  | { testCaseId: string; position: number; isPublic: true; status: SubmissionStatus; timeMs: number | null; input: string; expectedOutput: string; stdout: string; stderr: string }
  | { testCaseId: string; position: number; isPublic: false; status: SubmissionStatus; timeMs: number | null };
export interface SubmissionDetail extends SubmissionSummary {
  sourceCode: string;
  compileError: string | null;
  maxTimeMs: number | null;
  maxMemoryKb: number | null;
  results: SubmissionTestResult[];
}

const VERDICT: Record<SubmissionStatus, Verdict> = {
  pending: 'Pending',
  running: 'Running',
  accepted: 'AC',
  wrong_answer: 'WA',
  time_limit_exceeded: 'TLE',
  runtime_error: 'RE',
  compile_error: 'CE',
  internal_error: 'IE',
};
export const verdictOf = (s: SubmissionStatus): Verdict => VERDICT[s];
export const isGrading = (s: SubmissionStatus) => s === 'pending' || s === 'running';
// Cùng ngưỡng kẹt với BE (5 phút): quá hạn thì BE dọn bài khi nộp mới, FE không khoá nút nữa.
const STALE_MS = 5 * 60_000;
export const isInflight = (s: SubmissionSummary) => isGrading(s.status) && Date.now() - Date.parse(s.submittedAt) < STALE_MS;
