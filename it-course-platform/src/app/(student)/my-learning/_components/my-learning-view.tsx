'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { EnrollmentCard } from '@/components/shared/enrollment-card';
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
          {items.map((e) => <EnrollmentCard key={e.course.id} enrollment={e} />)}
        </ul>
      )}
    </div>
  );
}
