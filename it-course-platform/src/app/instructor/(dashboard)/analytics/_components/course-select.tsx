'use client';

import { AlertTriangle, BookOpen, Users } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listAnalyticsCourses } from '@/lib/api/analytics';
import type { AnalyticsCourse } from '@/types/analytics';
import { AnalyticsEmpty, AnalyticsHeader } from './analytics-shell';

// Khung chung 3 trang phân tích theo khoá: tiêu đề + ô chọn khoá + trạng thái lỗi / chưa có khoá / khoá chưa có học viên.
// Khoá đang xem nằm trên URL (?course=) để quay lại / chia sẻ đúng khoá; thiếu thì lấy khoá nhiều học viên nhất.
export function CourseScopedPage({
  title,
  description,
  skeleton,
  children,
}: {
  title: string;
  description: string;
  skeleton: ReactNode;
  children: (course: AnalyticsCourse) => ReactNode;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [courses, setCourses] = useState<AnalyticsCourse[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    listAnalyticsCourses().then(setCourses, () => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex-1 p-6">
        <AnalyticsEmpty icon={AlertTriangle} title="Không tải được danh sách khoá học">Tải lại trang để thử lại.</AnalyticsEmpty>
      </div>
    );
  }
  if (!courses) return skeleton;
  const course = courses.find((c) => c.id === params.get('course')) ?? courses[0] ?? null;
  const select = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('course', id);
    router.replace(`${pathname}?${next}`, { scroll: false });
  };
  const items = Object.fromEntries(courses.map((c) => [c.id, c.title]));
  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto p-6">
      <AnalyticsHeader title={title} description={description}>
        {course && (
          <Select items={items} value={course.id} onValueChange={(v) => v && select(v)}>
            <SelectTrigger className="h-11 w-full bg-card sm:w-80" aria-label="Chọn khoá học">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title} · {c.enrolled} học viên
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </AnalyticsHeader>
      {!course ? (
        <AnalyticsEmpty icon={BookOpen} title="Bạn chưa có khoá học nào">Tạo và xuất bản khoá học để bắt đầu có số liệu.</AnalyticsEmpty>
      ) : course.enrolled === 0 ? (
        <AnalyticsEmpty icon={Users} title="Khoá này chưa có học viên">Số liệu xuất hiện khi có học viên ghi danh và làm bài.</AnalyticsEmpty>
      ) : (
        children(course)
      )}
    </div>
  );
}
