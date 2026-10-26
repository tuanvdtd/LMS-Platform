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
  progressPct: number;
  completedAt: string | null;
  resumeItemId: string | null;
  sections: LearnSection[];
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
  manualComplete: boolean;
  resources: LectureResource[];
  progress: { lastPositionSec: number; watchedSec: number; completed: boolean };
}

export interface ProgressResult {
  completed: boolean;
  progressPct: number;
}

export interface Note {
  id: string;
  positionSec: number;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export const NOTE_MAX = 1000; // khớp BE learn.schemas.ts
