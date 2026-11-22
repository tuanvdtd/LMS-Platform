'use client';

import { AlertTriangle, Gauge, Info } from 'lucide-react';
import { AnalyticsSkillsBody, AnalyticsSkillsSkeleton } from '@/components/skeletons/analytics-skills-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { fmtPct, fmtRatio, GAIN_META } from '@/lib/analytics';
import { getClassSkills } from '@/lib/api/analytics';
import { MASTERY_COLOR, MASTERY_LABEL, masteryLevel, type MasteryLevel } from '@/lib/skills';
import type { TopicSkill } from '@/types/analytics';
import { AnalyticsEmpty, Panel } from '../../_components/analytics-shell';
import { CourseScopedPage } from '../../_components/course-select';
import { useKeyed } from '../../_components/use-keyed';

const LEVELS: MasteryLevel[] = ['weak', 'mid', 'strong'];
// DESIGN.md: skill-* chỉ làm màu tô (MASTERY_COLOR, inline vì token không có utility Tailwind); nhãn chữ dùng danger / warning / success.
const TEXT: Record<MasteryLevel, string> = { weak: 'text-danger', mid: 'text-warning', strong: 'text-success' };

export function ClassSkillsView() {
  return (
    <CourseScopedPage
      title="Năng lực lớp"
      description="Năng lực của học viên trong khoá ở từng topic, đo bằng bài đánh giá kỹ năng của nền tảng, và thay đổi trong thời gian học."
      skeleton={<AnalyticsSkillsSkeleton />}
    >
      {(course) => <ClassSkills key={course.id} courseId={course.id} />}
    </CourseScopedPage>
  );
}

function ClassSkills({ courseId }: { courseId: string }) {
  const { data, error } = useKeyed(courseId, getClassSkills);
  if (error) return <AnalyticsEmpty icon={AlertTriangle} title="Không tải được số liệu">Tải lại trang để thử lại.</AnalyticsEmpty>;
  if (!data) return <AnalyticsSkillsBody />;
  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <Info aria-hidden />
        <AlertTitle>Nguồn số liệu</AlertTitle>
        <AlertDescription>
          Bài đánh giá kỹ năng của Aolumi (12 câu thích ứng, chấm theo Elo). Không tính quiz hay bài code trong khoá. Chỉ hiện khi có từ{' '}
          {data.minGroup} học viên để không lộ kết quả của từng người.
        </AlertDescription>
      </Alert>
      {data.topics.length ? (
        data.topics.map((t) => <TopicCard key={t.topicId} t={t} enrolled={data.enrolled} min={data.minGroup} />)
      ) : (
        <AnalyticsEmpty icon={Gauge} title="Khoá chưa gắn topic">Gắn topic cho khoá trong phần thông tin cơ bản để xem năng lực lớp.</AnalyticsEmpty>
      )}
    </div>
  );
}

function TopicCard({ t, enrolled, min }: { t: TopicSkill; enrolled: number; min: number }) {
  return (
    <Panel title={t.name} action={t.isPrimary ? <Badge variant="info">Topic chính</Badge> : undefined}>
      {!t.hasBank ? (
        <p className="text-sm text-muted-foreground">Nền tảng chưa có bài đánh giá cho topic này nên chưa đo được.</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground">Năng lực hiện tại</h3>
            <p className="text-sm text-muted-foreground">
              {t.measured}/{enrolled} học viên đã làm bài đánh giá
            </p>
            {t.masteryPcts ? (
              <Distribution pcts={t.masteryPcts} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Cần ít nhất {min} học viên đã làm bài đánh giá để hiện phân bố (hiện có {t.measured}).
              </p>
            )}
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground">Thay đổi trong thời gian học</h3>
            {t.gain ? (
              <Gain g={t.gain} />
            ) : (
              <p className="text-sm text-muted-foreground">Cần ít nhất {min} học viên làm bài đánh giá cả trước và sau khi ghi danh.</p>
            )}
          </section>
        </div>
      )}
    </Panel>
  );
}

// pcts đã sắp tăng dần (BE).
function Distribution({ pcts }: { pcts: number[] }) {
  const count = (l: MasteryLevel) => pcts.filter((p) => masteryLevel(p) === l).length;
  const median = pcts[Math.floor(pcts.length / 2)];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-secondary" role="img" aria-label={LEVELS.map((l) => `${MASTERY_LABEL[l]} ${count(l)} học viên`).join(', ')}>
        {LEVELS.map((l) => count(l) > 0 && <div key={l} style={{ width: `${(100 * count(l)) / pcts.length}%`, background: MASTERY_COLOR[l] }} />)}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {LEVELS.map((l) => (
          <li key={l} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: MASTERY_COLOR[l] }} aria-hidden />
            <span className={TEXT[l]}>{MASTERY_LABEL[l]}</span>
            <span className="font-mono">{count(l)}</span>
          </li>
        ))}
      </ul>
      <div className="relative h-12" role="img" aria-label={`Mỗi chấm là một học viên, không hiện tên. Trung vị ${fmtPct(median)}`}>
        <div className="absolute inset-x-0 bottom-4 h-px bg-border" />
        {[40, 70].map((x) => (
          <span key={x} className="absolute top-0 bottom-4 w-px bg-border" style={{ left: `${x}%` }} />
        ))}
        {[0, 40, 70, 100].map((x) => (
          <span key={`t${x}`} className="absolute bottom-0 -translate-x-1/2 font-mono text-[10px] text-muted-foreground" style={{ left: `${x}%` }}>
            {x}%
          </span>
        ))}
        {pcts.map((p, i) => (
          <span key={i} className="absolute size-2 -translate-x-1/2 rounded-full" style={{ left: `${p}%`, top: `${(i % 4) * 7 + 2}px`, background: MASTERY_COLOR[masteryLevel(p)] }} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Trung vị lớp <span className="font-mono text-foreground">{fmtPct(median)}</span> · mỗi chấm là một học viên, không hiện tên
      </p>
    </div>
  );
}

function Gain({ g }: { g: NonNullable<TopicSkill['gain']> }) {
  const lo = Math.min(g.prePct, g.postPct);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{g.pairs} học viên có điểm trước và sau khi ghi danh</p>
      <div className="relative h-8" role="img" aria-label={`Trung bình trước ghi danh ${fmtPct(g.prePct)}, hiện tại ${fmtPct(g.postPct)}`}>
        <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary/40" style={{ left: `${lo}%`, width: `${Math.abs(g.postPct - g.prePct)}%` }} />
        <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-muted-foreground bg-card" style={{ left: `${g.prePct}%` }} />
        <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" style={{ left: `${g.postPct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Trước: <span className="font-mono text-foreground">{fmtPct(g.prePct)}</span>
        </span>
        <span>
          Hiện tại: <span className="font-mono text-foreground">{fmtPct(g.postPct)}</span>
        </span>
      </div>
      <p className="flex flex-wrap items-center gap-2 text-sm">
        Normalized gain <span className="font-mono font-semibold">{fmtRatio(g.g)}</span>
        {g.band && <Badge variant={GAIN_META[g.band].tone}>{GAIN_META[g.band].label}</Badge>}
      </p>
      <p className="text-sm text-muted-foreground">
        {g.improved} tăng · {g.same} giữ nguyên · {g.declined} giảm (lệch quá 5 điểm % mới tính là tăng/giảm)
      </p>
      <p className="text-xs text-muted-foreground">Đây là thay đổi đo được trong thời gian học, không khẳng định khoá học là nguyên nhân duy nhất.</p>
    </div>
  );
}
