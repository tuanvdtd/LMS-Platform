import Link from 'next/link';
import { SkillMasteryBar } from '@/components/shared/product-ui';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatWait } from '@/lib/skills';
import type { SkillTopic } from '@/types/skills';

const WAIT_NOTE = 'Làm lại sau 24 giờ kể từ lần bắt đầu trước';

// Đang làm dở → chưa đo → đã đo (pct tăng dần, yếu lên trước).
const rank = (t: SkillTopic) => (t.inProgressAttemptId ? 0 : t.pct === null ? 1 : 2);
const sortTopics = (ts: SkillTopic[]) =>
  [...ts].sort((a, b) => rank(a) - rank(b) || (a.pct ?? 0) - (b.pct ?? 0) || a.name.localeCompare(b.name, 'vi'));

const waiting = (t: SkillTopic, now: number) =>
  !t.inProgressAttemptId && !!t.nextAvailableAt && new Date(t.nextAvailableAt).getTime() > now;

function Action({ t, now, noteId }: { t: SkillTopic; now: number; noteId: string }) {
  const href = `/skills/${t.slug}`;
  const cls = 'min-h-11 w-28 shrink-0 sm:min-h-9';
  if (t.inProgressAttemptId) return <Link href={href} aria-label={`Làm tiếp: ${t.name}`} className={buttonVariants({ className: cls })}>Làm tiếp</Link>;
  const wait = t.nextAvailableAt ? new Date(t.nextAvailableAt).getTime() - now : 0;
  if (wait > 0) {
    const label = formatWait(wait);
    // locked: vẫn Tab tới được để title/aria nói lý do chờ.
    return (
      <Button locked variant="outline" className={cls} aria-label={`${label}: ${t.name}`} aria-describedby={noteId}>
        {label}
      </Button>
    );
  }
  return (
    <Link
      href={href}
      aria-label={`${t.pct === null ? 'Làm bài' : 'Làm lại'}: ${t.name}`}
      className={buttonVariants({ variant: t.pct === null ? 'default' : 'outline', className: cls })}
    >
      {t.pct === null ? 'Làm bài' : 'Làm lại'}
    </Link>
  );
}

export function SkillsList({ topics, now }: { topics: SkillTopic[]; now: number }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="list-title">
      <h2 id="list-title" className="font-bold text-foreground">Bài đánh giá kỹ năng</h2>
      <p className="mb-4 text-sm text-muted-foreground">12 câu · 15 phút · câu hỏi đổi độ khó theo câu trả lời của bạn</p>
      {topics.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có bài đánh giá nào.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sortTopics(topics).map((t) => (
            <li key={t.id} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                {t.pct === null ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{t.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">Chưa đo</span>
                  </div>
                ) : (
                  <SkillMasteryBar name={t.name} pct={t.pct} />
                )}
                {waiting(t, now) && <p id={`wait-${t.id}`} className="mt-1 text-xs text-muted-foreground">{WAIT_NOTE}</p>}
              </div>
              <Action t={t} now={now} noteId={`wait-${t.id}`} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
