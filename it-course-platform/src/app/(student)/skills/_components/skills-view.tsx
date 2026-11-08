'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getSkills } from '@/lib/api/skills';
import { masteryLevel } from '@/lib/skills';
import { OCCUPATION_LABEL } from '@/types/preferences';
import { SKILL_LEVEL_LABEL } from '@/types/instructor-course';
import type { SkillsOverview } from '@/types/skills';
import { SkillGraph } from './skill-graph';
import { SkillsCharts } from './skills-charts';
import { SkillsList } from './skills-list';
import { SkillsSkeleton } from './skills-skeleton';

export function SkillsView() {
  // `now` chốt lúc tải xong để render thuần (nhãn chờ 24h tính theo mốc này).
  const [data, setData] = useState<{ overview: SkillsOverview; now: number } | null>(null);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    getSkills().then(
      (overview) => { setData({ overview, now: Date.now() }); setError(false); },
      () => setError(true),
    );
  }, [nonce]);

  // Còn topic đang chờ 24h → tick lại (tối đa mỗi phút) để nhãn đếm xuống và nút mở khoá khi hết chờ.
  useEffect(() => {
    if (!data) return;
    const waits = data.overview.topics
      .map((t) => (t.nextAvailableAt ? new Date(t.nextAvailableAt).getTime() - data.now : 0))
      .filter((w) => w > 0);
    if (!waits.length) return;
    const id = setTimeout(
      () => setData((d) => d && { ...d, now: Date.now() }),
      Math.min(Math.min(...waits) + 500, 60_000),
    );
    return () => clearTimeout(id);
  }, [data]);

  if (error) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-extrabold text-foreground">Hồ sơ năng lực</h1>
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-foreground">Không tải được hồ sơ năng lực.</p>
          <Button variant="outline" className="min-h-11 sm:min-h-9" onClick={() => { setError(false); setNonce((n) => n + 1); }}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }
  if (!data) return <SkillsSkeleton />;

  const { overview: { profile, topics, history, edges }, now } = data;
  const measured = topics.filter((t) => t.pct !== null);
  const count = (lv: string) => measured.filter((t) => masteryLevel(t.pct!) === lv).length;
  const goal = [
    profile.occupation && `Mục tiêu: ${OCCUPATION_LABEL[profile.occupation]}`,
    profile.level && `Trình độ: ${SKILL_LEVEL_LABEL[profile.level]}`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-1 text-2xl font-extrabold text-foreground">Hồ sơ năng lực</h1>
          {goal && <p className="text-sm text-muted-foreground">{goal}</p>}
        </div>
        {measured.length > 0 && (
          <dl className="flex gap-6 md:ml-auto">
            {([['strong', 'Kỹ năng vững'], ['mid', 'Đang học'], ['weak', 'Cần củng cố']] as const).map(([lv, label]) => (
              <div key={lv} className="flex flex-col-reverse text-center">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-2xl font-extrabold text-foreground">{count(lv)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {measured.length > 0 ? (
        <>
          <SkillsCharts topics={topics} history={history} />
          <SkillGraph topics={topics} edges={edges} />
        </>
      ) : topics.length > 0 ? (
        <p className="max-w-prose text-sm text-muted-foreground">
          Mỗi bài đánh giá gồm 12 câu trong 15 phút, cho biết bạn đang vững hay yếu ở kỹ năng nào để chọn khoá học phù hợp.
          Làm xong một bài là hồ sơ này bắt đầu có biểu đồ và sơ đồ lộ trình.
        </p>
      ) : null}

      <SkillsList topics={topics} now={now} />
    </div>
  );
}
