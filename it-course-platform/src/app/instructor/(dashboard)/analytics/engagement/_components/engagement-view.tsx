// src/app/instructor/(dashboard)/analytics/engagement/_components/engagement-view.tsx
'use client';

import { AlertTriangle, RotateCw, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { EngagementBody as Loading, EngagementSkeleton } from '@/components/skeletons/engagement-skeleton';
import { Button } from '@/components/ui/button';
import { getEngagement } from '@/lib/api/analytics';
import { AnalyticsEmpty } from '../../_components/analytics-shell';
import { CourseScopedPage } from '../../_components/course-select';
import { useKeyed } from '../../_components/use-keyed';
import { ActivityChart } from './activity-chart';
import { EngagementKpis } from './engagement-kpis';
import { LecturesTable } from './lectures-table';
import { ProgressList } from './progress-list';
import { RetentionPanel } from './retention-panel';

export function EngagementView() {
  return (
    <CourseScopedPage
      title="Hành vi học"
      description="Học viên có học đều không, video nào giữ chân được người xem và bài nào khiến họ dừng lại."
      skeleton={<EngagementSkeleton />}
    >
      {(course) => <EngagementBody key={course.id} courseId={course.id} />}
    </CourseScopedPage>
  );
}

function EngagementBody({ courseId }: { courseId: string }) {
  const { data, error, reload } = useKeyed(courseId, getEngagement);
  const wanted = useSearchParams().get('lecture');
  if (error) {
    return (
      <AnalyticsEmpty icon={AlertTriangle} title="Không tải được số liệu">
        <Button variant="outline" size="sm" onClick={reload}>
          <RotateCw data-icon="inline-start" /> Thử lại
        </Button>
      </AnalyticsEmpty>
    );
  }
  if (!data) return <Loading />;
  if (data.enrolled === 0) {
    return (
      <AnalyticsEmpty icon={Users} title="Khoá chưa có học viên">
        Số liệu xuất hiện khi có học viên ghi danh và học.
      </AnalyticsEmpty>
    );
  }
  const selectedId = data.lectures.find((l) => l.itemId === wanted)?.itemId ?? data.defaultLecture?.itemId ?? data.lectures[0]?.itemId ?? null;
  return (
    <div className="flex flex-col gap-6">
      <EngagementKpis data={data} />
      <ActivityChart weekly={data.weekly} />
      <ProgressList courseId={courseId} progress={data.progress} videoIds={new Set(data.lectures.map((l) => l.itemId))} />
      <LecturesTable lectures={data.lectures} selectedId={selectedId} />
      {selectedId && <RetentionPanel itemId={selectedId} enrolled={data.enrolled} defaultLecture={data.defaultLecture} />}
    </div>
  );
}
