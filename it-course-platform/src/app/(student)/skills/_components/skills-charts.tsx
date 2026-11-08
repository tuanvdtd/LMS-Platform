'use client';

import { useState } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { SkillsOverview } from '@/types/skills';

const TOOLTIP_STYLE = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 };
const TICK = { fontSize: 11, fill: 'var(--muted-foreground)' };
const fmtDay = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function SkillsCharts({ topics, history }: Pick<SkillsOverview, 'topics' | 'history'>) {
  const measured = topics.filter((t) => t.pct !== null);
  const radarData = measured.map((t) => ({ subject: t.name, score: t.pct }));

  // Chỉ topic có lịch sử mới chọn được; mặc định topic có lần làm mới nhất.
  const withHistory = topics.filter((t) => history.some((h) => h.topicId === t.id));
  const latest = [...history].sort((a, b) => b.at.localeCompare(a.at))[0];
  const [picked, setPicked] = useState<string | null>(null);
  const activeId = withHistory.some((t) => t.id === picked) ? picked : latest?.topicId;
  const points = history
    .filter((h) => h.topicId === activeId)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((h) => ({ date: fmtDay(h.at), pct: h.pct }));
  const activeName = topics.find((t) => t.id === activeId)?.name ?? '';

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="radar-title">
        <h2 id="radar-title" className="mb-4 font-bold text-foreground">Tổng quan kỹ năng</h2>
        {measured.length < 3 ? (
          <p className="flex h-60 items-center justify-center text-center text-sm text-muted-foreground">
            Đo ít nhất 3 kỹ năng để xem biểu đồ tổng quan.
          </p>
        ) : (
          <div
            role="img"
            aria-label={`Biểu đồ radar: ${measured.map((t) => `${t.name} ${t.pct}%`).join(', ')}`}
          >
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={TICK} />
                <Radar name="Năng lực" dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {points.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="history-title">
          <h2 id="history-title" className="mb-3 font-bold text-foreground">Lịch sử tiến bộ</h2>
          <ToggleGroup
            variant="outline"
            size="sm"
            aria-label="Chọn kỹ năng"
            className="mb-3 w-full flex-wrap"
            value={activeId ? [activeId] : []}
            onValueChange={(v) => v[0] && setPicked(v[0])}
          >
            {withHistory.map((t) => (
              <ToggleGroupItem key={t.id} value={t.id} className="min-h-11 sm:min-h-9">{t.name}</ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div
            role="img"
            aria-label={`Điểm ${activeName} qua các lần làm: ${points.map((p) => `${p.date} ${p.pct}%`).join(', ')}`}
          >
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={TICK} />
                <YAxis tick={TICK} domain={[0, 100]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }} />
                <ReferenceLine y={40} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                <ReferenceLine y={70} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="pct" name={activeName} stroke="var(--primary)" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Đường nét đứt: mốc 40% và 70%.</p>
        </section>
      )}
    </div>
  );
}
