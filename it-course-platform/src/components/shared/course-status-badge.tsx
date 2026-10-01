import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { COURSE_STATUS_LABEL, type CourseStatus } from '@/types/instructor-course';

const TONE: Record<CourseStatus, string> = {
  draft: 'bg-secondary text-secondary-foreground',
  in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  published: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  unpublished: 'bg-muted text-muted-foreground',
};

export function CourseStatusBadge({ status, className }: { status: CourseStatus; className?: string }) {
  return <Badge className={cn(TONE[status], className)}>{COURSE_STATUS_LABEL[status]}</Badge>;
}
