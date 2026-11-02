import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { MyEnrollment } from '@/types/checkout';

// Thẻ khoá đã ghi danh: dùng ở "Học tập của tôi" và "Tiếp tục học" trên trang chủ.
export function EnrollmentCard({ enrollment: { course, progressPct } }: { enrollment: MyEnrollment }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <Link href={`/course/${course.slug}`} className="block" aria-hidden tabIndex={-1}>
        {course.thumbnailUrl ? (
          <Image src={course.thumbnailUrl} alt="" width={320} height={180} unoptimized className="aspect-video w-full object-cover" />
        ) : (
          <div className="aspect-video w-full bg-muted" />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/course/${course.slug}`} className="line-clamp-2 text-sm font-semibold text-foreground hover:underline">
          {course.title}
        </Link>
        <p className="text-xs text-muted-foreground">{course.instructor.name}</p>
        <div className="mt-auto space-y-2 pt-1">
          <Progress value={Number(progressPct)} aria-label={`Đã học ${Math.round(Number(progressPct))}%`} />
          <Link href={`/learn/${course.slug}`} className={buttonVariants({ size: 'sm', className: 'h-11 w-full' })}>
            {Number(progressPct) > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
          </Link>
        </div>
      </div>
    </li>
  );
}
