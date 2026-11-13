// API khung học + bài giảng.
export type LearnItemType = 'lecture' | 'quiz' | 'practice_test' | 'coding_exercise';
export type LectureKind = 'video' | 'document';

export interface LearnItem {
  id: string;
  type: LearnItemType;
  title: string;
  lectureKind: LectureKind | null;
  durationSec: number;
  completed: boolean;
}

export interface LearnSection {
  id: string;
  title: string;
  items: LearnItem[];
}

export interface LearnOutline {
  course: { id: string; slug: string; title: string };
  isOwner: boolean; // chủ khoá đang xem trước khoá của mình
  progressPct: number;
  completedAt: string | null;
  resumeItemId: string | null;
  sections: LearnSection[];
  review: ReviewItem[];
}

// Bài giảng nên ôn: liên quan tới câu sai ở lượt nộp gần nhất của từng quiz.
export interface ReviewItem {
  itemId: string;
  title: string;
  wrongCount: number;
  quizzes: { itemId: string; title: string }[];
}

export interface LectureResource {
  id: string;
  title: string;
  fileName: string;
  sizeBytes: number;
}

export interface Lecture {
  id: string;
  title: string;
  description: string | null;
  lectureKind: LectureKind;
  durationSec: number;
  mediaUrl: string | null;
  downloadUrl: string | null;
  resources: LectureResource[];
  progress: { lastPositionSec: number; completed: boolean };
}

export interface ProgressResult {
  completed: boolean;
  progressPct: number;
  certificateSerial?: string | null; // chỉ có khi vừa hoàn thành bài; khác null = vừa được cấp chứng chỉ
}

export interface Note {
  id: string;
  positionSec: number;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export const NOTE_MAX = 1000; // khớp BE learn.schemas.ts
