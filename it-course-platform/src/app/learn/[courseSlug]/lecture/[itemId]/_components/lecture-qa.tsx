// …/_components/lecture-qa.tsx
'use client';

import { useMemo } from 'react';
import { QaBoard, type QaApi } from '@/components/qa/qa-board';
import { askQuestion, deleteAnswer, deleteQuestion, getQuestion, listQuestions, postAnswer } from '@/lib/api/qa';

// Tab Hỏi đáp của bài giảng: câu hỏi gắn bài đang xem. question/answer: mở từ thông báo.
export function LectureQa({
  courseSlug,
  itemId,
  question,
  answer,
}: {
  courseSlug: string;
  itemId: string;
  question?: string;
  answer?: string;
}) {
  const api = useMemo<QaApi>(
    () => ({
      list: (cursor) => listQuestions(courseSlug, { itemId, cursor }),
      get: (qid) => getQuestion(courseSlug, qid),
      ask: (body) => askQuestion(courseSlug, { body, itemId }),
      answer: (qid, body, replyToAnswerId) => postAnswer(courseSlug, qid, { body, replyToAnswerId }),
      removeQuestion: (qid) => deleteQuestion(courseSlug, qid),
      removeAnswer: (aid) => deleteAnswer(courseSlug, aid),
    }),
    [courseSlug, itemId],
  );
  const focus = useMemo(() => (question ? { questionId: question, answerId: answer } : undefined), [question, answer]);
  return <QaBoard key={itemId} api={api} focus={focus} title="Câu hỏi về bài này" empty="Chưa có câu hỏi nào cho bài này" />;
}
