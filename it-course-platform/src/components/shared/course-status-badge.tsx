import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { COURSE_STATUS_LABEL, type CourseStatus } from '@/types/instructor-course';

const TONE = {
  draft: 'secondary',
  in_review: 'warning',
  published: 'success',
  unpublished: 'outline',
} as const satisfies Record<CourseStatus, string>;

export function CourseStatusBadge({ status, className }: { status: CourseStatus; className?: string }) {
  return <Badge variant={TONE[status]} className={cn(status === 'unpublished' && 'text-muted-foreground', className)}>{COURSE_STATUS_LABEL[status]}</Badge>;
}
