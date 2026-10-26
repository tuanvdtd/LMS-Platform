'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { QaBoard, type QaApi } from '@/components/qa/qa-board';
import type { LocalQuestion } from '@/components/qa/qa-thread';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listMyCourses } from '@/lib/api/instructor-courses';
import { deleteInstructorAnswer, deleteInstructorQuestion, listInstructorQuestions, postInstructorAnswer } from '@/lib/api/qa';

// Giảng viên không ghi danh khoá mình → dẫn sang trang khoá công khai thay vì /learn.
const context = (q: LocalQuestion) => (
  <p className="pt-3 text-xs text-muted-foreground">
    <Link href={`/course/${q.course.slug}`} className="font-medium text-foreground hover:underline">{q.course.title}</Link>
    {q.item && <> · {q.item.title}</>}
  </p>
);

const ALL = 'all';
type Filter = 'unanswered' | 'all';

// Hỏi đáp của giảng viên (spec 2026-10-20-course-qa §5): mặc định câu chưa có giảng viên trả lời, lọc theo khoá.
export function QAView() {
  const [filter, setFilter] = useState<Filter>('unanswered');
  const [courseId, setCourseId] = useState(ALL);
  const [courses, setCourses] = useState<Record<string, string>>({ [ALL]: 'Tất cả khoá học' });

  useEffect(() => {
    listMyCourses().then(
      (l) => setCourses({ [ALL]: 'Tất cả khoá học', ...Object.fromEntries(l.map((c) => [c.id, c.title])) }),
      () => undefined, // không tải được danh sách khoá vẫn xem "Tất cả khoá học" được
    );
  }, []);

  const api = useMemo<QaApi>(
    () => ({
      list: (cursor) =>
        listInstructorQuestions({
          courseId: courseId === ALL ? undefined : courseId,
          unanswered: filter === 'unanswered' ? '1' : undefined,
          cursor,
        }),
      answer: (qid, body, replyToAnswerId) => postInstructorAnswer(qid, { body, replyToAnswerId }),
      removeQuestion: deleteInstructorQuestion,
      removeAnswer: deleteInstructorAnswer,
    }),
    [courseId, filter],
  );

  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-extrabold text-foreground">Hỏi đáp</h1>
        <Select items={courses} value={courseId} onValueChange={(v) => v && setCourseId(v)}>
          <SelectTrigger className="h-11 w-full bg-card sm:w-64" aria-label="Lọc theo khoá học">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(courses).map(([id, title]) => (
                <SelectItem key={id} value={id}>
                  {title}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="flex gap-2" role="group" aria-label="Lọc câu hỏi">
          {(['unanswered', 'all'] as const).map((f) => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} className="h-11" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'unanswered' ? 'Chưa trả lời' : 'Tất cả'}
            </Button>
          ))}
        </div>
      </div>
      <QaBoard
        key={`${filter}-${courseId}`}
        api={api}
        title="Câu hỏi"
        context={context}
        empty={filter === 'unanswered' ? 'Không còn câu hỏi nào chờ bạn trả lời.' : 'Chưa có câu hỏi nào.'}
      />
    </div>
  );
}
