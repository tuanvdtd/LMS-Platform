'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { getMyEnrollments } from '@/lib/api/checkout';
import type { MyEnrollment } from '@/types/checkout';

export default function MyLearningView() {
  const [items, setItems] = useState<MyEnrollment[] | null>(null);

  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    getMyEnrollments().then(
      (i) => { setItems(i); setError(false); },
      () => { setError(true); toast.error('Không tải được danh sách khoá học'); },
    );
  }, [nonce]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-foreground">Học tập của tôi</h1>

      {!items ? (
        <p className="text-muted-foreground">
          {error ? <>Không tải được danh sách khoá học. <Button variant="outline" size="sm" onClick={() => setNonce((n) => n + 1)}>Thử lại</Button></> : 'Đang tải…'}
        </p>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <BookOpen className="mx-auto mb-4 size-10 text-muted-foreground" aria-hidden />
          <p className="mb-4 text-lg text-muted-foreground">Bạn chưa ghi danh khoá nào</p>
          <Link href="/courses" className={buttonVariants()}>Khám phá khoá học</Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map(({ course }) => (
            <li key={course.id}>
              <Link href={`/course/${course.slug}`} className="block overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md">
                {course.thumbnailUrl ? (
                  <Image src={course.thumbnailUrl} alt="" width={320} height={180} unoptimized className="aspect-video w-full object-cover" />
                ) : (
                  <div className="aspect-video w-full bg-muted" />
                )}
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-foreground">{course.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{course.instructor.name}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
