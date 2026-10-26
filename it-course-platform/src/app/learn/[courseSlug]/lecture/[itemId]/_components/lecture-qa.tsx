// …/_components/lecture-qa.tsx
'use client';

import { useMemo } from 'react';
import { QaBoard, type QaApi } from '@/components/qa/qa-board';
import { askQuestion, deleteAnswer, deleteQuestion, listQuestions, postAnswer } from '@/lib/api/qa';

// Tab Hỏi đáp của bài giảng: câu hỏi gắn bài đang xem.
export function LectureQa({ courseSlug, itemId }: { courseSlug: string; itemId: string }) {
  const api = useMemo<QaApi>(
    () => ({
      list: (cursor) => listQuestions(courseSlug, { itemId, cursor }),
      ask: (body) => askQuestion(courseSlug, { body, itemId }),
      answer: (qid, body, replyToAnswerId) => postAnswer(courseSlug, qid, { body, replyToAnswerId }),
      removeQuestion: (qid) => deleteQuestion(courseSlug, qid),
      removeAnswer: (aid) => deleteAnswer(courseSlug, aid),
    }),
    [courseSlug, itemId],
  );
  return <QaBoard key={itemId} api={api} title="Hỏi đáp" empty="Chưa có câu hỏi nào cho bài này" />;
}
