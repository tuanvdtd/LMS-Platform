// src/app/instructor/(dashboard)/analytics/engagement/_components/engagement-kpis.tsx
import { StatCard } from '@/components/shared/product-ui';
import { deltaPct, fmtNum, fmtShare } from '@/lib/analytics';
import type { Engagement } from '@/types/analytics';

export function EngagementKpis({ data }: { data: Engagement }) {
  const { kpis, enrolled } = data;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Học viên hoạt động 7 ngày"
          value={fmtNum(kpis.active7d)}
          change={deltaPct(kpis.active7d, kpis.active7dPrev)}
        />
        <StatCard
          label="Phút video đã xem (30 ngày)"
          value={fmtNum(kpis.watchMin30d)}
          change={deltaPct(kpis.watchMin30d, kpis.watchMin30dPrev)}
        />
        <StatCard label="Tỉ lệ hoàn thành khoá" value={fmtShare(kpis.completed / enrolled)} sub={`trên ${enrolled} ghi danh`} />
      </div>
      <p className="text-xs text-muted-foreground">
        Hoạt động = xem video, mở / hoàn thành bài, làm quiz hoặc nộp bài code. Đọc bài PDF mà không đánh dấu hoàn thành chưa được tính. Phút video tính theo thời lượng nội dung.
      </p>
    </div>
  );
}
