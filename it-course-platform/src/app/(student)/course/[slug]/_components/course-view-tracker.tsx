// src/app/(student)/course/[slug]/_components/course-view-tracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import { trackCourseView } from '@/lib/api/catalog-client';
import { getConsent } from '@/lib/cookie-consent';
import { visitorId } from '@/lib/visitor-id';

// Đếm lượt xem trang khoá cho phễu chuyển đổi của giảng viên. Gửi một lần mỗi lần mở trang; lỗi thì bỏ qua (không ảnh hưởng trang).
export function CourseViewTracker({ courseId }: { courseId: string }) {
  const sent = useRef<string | null>(null);
  useEffect(() => {
    if (sent.current === courseId) return; // Strict Mode chạy effect hai lần ở dev
    sent.current = courseId;
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    trackCourseView(courseId, visitorId(getConsent() === 'accepted', storage)).catch(() => {});
  }, [courseId]);
  return null;
}
