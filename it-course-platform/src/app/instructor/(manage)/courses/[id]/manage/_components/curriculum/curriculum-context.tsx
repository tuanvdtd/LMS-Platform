'use client';

import { createContext, use } from 'react';
import type { CurriculumResponse } from '@/types/curriculum';

export type CurriculumContextValue = {
  courseId: string;
  locked: boolean; // khoá in_review
  busy: boolean; // đang có request → tạm khoá kéo thả để khỏi chồng thao tác
  // Gọi API → thay cây + checklist; lỗi → toast/khoá form/tải lại. Trả true nếu thành công.
  run: (fn: () => Promise<CurriculumResponse>, failMessage?: string) => Promise<boolean>;
  openItemId: string | null; // chỉ mở 1 LectureDetailPanel một lúc (spec §5.2)
  toggleItem: (id: string) => void;
  confirm: (message: string, action: () => void) => void;
  lectures: { id: string; title: string }[]; // cho ô "Bài giảng liên quan" của câu hỏi quiz
};

export const CurriculumContext = createContext<CurriculumContextValue | null>(null);

export function useCurriculum(): CurriculumContextValue {
  const value = use(CurriculumContext);
  if (!value) throw new Error('useCurriculum phải nằm trong CurriculumEditor');
  return value;
}
