import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { COURSE_STATUS_LABEL, type CourseStatus } from '@/types/instructor-course';

const TONE: Record<CourseStatus, string> = {
  draft: 'bg-secondary text-secondary-foreground',
  in_review: 'bg-warning-soft text-warning',
  published: 'bg-success-soft text-success',
  unpublished: 'bg-muted text-muted-foreground',
};

export function CourseStatusBadge({ status, className }: { status: CourseStatus; className?: string }) {
  return <Badge className={cn(TONE[status], className)}>{COURSE_STATUS_LABEL[status]}</Badge>;
}
