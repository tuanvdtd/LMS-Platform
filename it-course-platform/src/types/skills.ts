// Mirror response của back-end/src/skills (skills.service.ts, skill-bank.service.ts).
import type { QuestionPayload } from '@/types/curriculum';
import type { LearnerLevel, Occupation } from '@/types/preferences';

export type SkillDifficulty = 'easy' | 'medium' | 'hard';

export interface SkillTopic {
  id: string;
  slug: string;
  name: string;
  pct: number | null;
  answerCount: number;
  nextAvailableAt: string | null;
  inProgressAttemptId: string | null;
}
export interface SkillEdge { topicId: string; requiresId: string }
export interface SkillsOverview {
  profile: { occupation: Occupation | null; level: LearnerLevel | null };
  topics: SkillTopic[];
  history: { topicId: string; at: string; pct: number }[];
  edges: SkillEdge[];
}

type TopicRef = { slug: string; name: string };
export interface AttemptQuestion {
  id: string;
  type: 'single_choice' | 'multiple_choice';
  stem: string;
  options: { id: string; content: string }[];
}
export interface AttemptResult {
  state: 'result';
  attemptId: string;
  topic: TopicRef;
  status: 'submitted' | 'expired';
  startedAt: string;
  finishedAt: string;
  pctBefore: number | null;
  pctAfter: number;
  ratingBefore: number;
  ratingAfter: number;
  answered: number;
  correct: number;
  items: { position: number; stem: string; isCorrect: boolean | null; skipped: boolean }[];
}
export type AttemptState =
  | {
      state: 'question';
      attemptId: string;
      topic: TopicRef;
      position: number;
      total: number;
      deadlineAt: string;
      now: string;
      question: AttemptQuestion;
    }
  | AttemptResult;

// ── Admin ngân hàng câu ──
export interface AdminSkillTopic {
  id: string;
  slug: string;
  name: string;
  active: Record<SkillDifficulty, number>;
  archived: number;
}
export interface AdminSkillQuestion {
  id: string;
  type: 'single_choice' | 'multiple_choice';
  stem: string;
  difficulty: SkillDifficulty;
  rating: number;
  answerCount: number;
  correctCount: number;
  archivedAt: string | null;
  options: { id: string; content: string; isCorrect: boolean; explanation: string | null }[];
}
export type SkillQuestionPayload = QuestionPayload & { difficulty: SkillDifficulty };
