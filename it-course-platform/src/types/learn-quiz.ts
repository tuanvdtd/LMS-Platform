import type { QuestionType } from '@/types/curriculum';

// Học viên làm quiz (spec 2026-10-17-quiz-taking §3).
export interface QuizOverview {
  itemId: string;
  title: string;
  description: string | null;
  passScorePct: number;
  questionCount: number;
  topics: { id: string; name: string }[];
  passed: boolean;
  bestScorePct: number | null;
  inProgressAttemptId: string | null;
  attempts: { id: string; attemptNo: number; scorePct: number; passed: boolean; submittedAt: string }[]; // mới nhất trước
}

export interface SheetQuestion {
  id: string;
  type: QuestionType;
  stem: string;
  options: { id: string; content: string }[];
}

// Không có isCorrect.
export interface AttemptSheet {
  attemptId: string;
  attemptNo: number;
  questions: SheetQuestion[];
}

export interface ResultQuestion {
  id: string;
  type: QuestionType;
  stem: string;
  isCorrect: boolean;
  selectedOptionIds: string[];
  relatedItem: { id: string; title: string } | null;
  options: { id: string; content: string; isCorrect: boolean; explanation: string | null }[];
}

export interface AttemptResult {
  attemptId: string;
  attemptNo: number;
  scorePct: number;
  passed: boolean;
  passScorePct: number;
  correctCount: number;
  total: number;
  timeSpentSec: number;
  topics: { id: string; name: string; masteryPct: number }[];
  questions: ResultQuestion[];
}

export interface SubmitPayload {
  answers: { questionId: string; optionIds: string[] }[];
}
