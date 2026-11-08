'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CircleCheck, Hourglass, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { searchTopics } from '@/lib/api/instructor-courses';
import { listSkillTopics } from '@/lib/api/skill-bank';
import { cn } from '@/lib/utils';
import type { AdminSkillTopic } from '@/types/skills';
import { HEAD, PageHeader, QueueMessage, ROW } from '../../_components/queue';
import { TOPIC_COLS } from './topic-cols';

const OPEN_MIN = 12; // khớp ngưỡng mở topic cho học viên (skill-elo.ts ở BE)

export const activeTotal = (a: Record<'easy' | 'medium' | 'hard', number>) => a.easy + a.medium + a.hard;

// Chip có chữ + icon, không chỉ màu.
export function TopicStatusChip({ total }: { total: number }) {
  const open = total >= OPEN_MIN;
  const Icon = open ? CircleCheck : Hourglass;
  return (
    <Badge className={cn('gap-1 font-semibold', open ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning')}>
      <Icon aria-hidden />
      {open ? 'Đang mở cho học viên' : 'Chưa đủ 12 câu'}
    </Badge>
  );
}

export function SkillTopicsView() {
  const [topics, setTopics] = useState<AdminSkillTopic[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let stale = false;
    listSkillTopics().then(
      (d) => {
        if (!stale) setTopics(d);
      },
      () => {
        if (!stale) setFailed(true);
      },
    );
    return () => {
      stale = true;
    };
  }, [reload]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Ngân hàng kỹ năng"
          description="Câu hỏi cho bài đánh giá năng lực. Topic cần ít nhất 12 câu đang dùng thì học viên mới làm bài được."
        />
        <Button onClick={() => setAdding(true)}>
          <Plus data-icon="inline-start" /> Thêm topic
        </Button>
      </div>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {failed ? (
          <QueueMessage
            kind="error"
            title="Không tải được ngân hàng câu"
            text="Kiểm tra kết nối rồi thử lại."
            onRetry={() => {
              setFailed(false);
              setReload((n) => n + 1);
            }}
          />
        ) : !topics ? (
          <div role="status" aria-busy="true" aria-label="Đang tải" className="divide-y">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cn('grid items-center gap-x-5 px-5 py-3.5', TOPIC_COLS)}>
                <Skeleton className="h-4 w-40" />
                <Skeleton className="hidden h-4 w-8 md:block" />
                <Skeleton className="hidden h-4 w-8 md:block" />
                <Skeleton className="hidden h-4 w-8 md:block" />
                <Skeleton className="hidden h-4 w-8 md:block" />
                <Skeleton className="h-6 w-36 rounded-full" />
              </div>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <QueueMessage kind="empty" title="Chưa có topic nào có câu hỏi." text="Bấm Thêm topic để chọn topic và soạn câu hỏi đầu tiên." />
        ) : (
          <>
            <div className={cn(HEAD, TOPIC_COLS)} aria-hidden>
              <span>Topic</span>
              <span>Dễ</span>
              <span>Vừa</span>
              <span>Khó</span>
              <span>Đã ẩn</span>
              <span>Trạng thái</span>
            </div>
            <ul className="divide-y">
              {topics.map((t) => (
                <li key={t.id}>
                  <Link href={`/admin/skill-bank/${t.id}`} className={cn(ROW, 'grid-cols-4 md:grid-cols-none', TOPIC_COLS)}>
                    <p className="col-span-4 truncate text-sm font-semibold text-foreground md:col-span-1">{t.name}</p>
                    <Count label="Dễ" n={t.active.easy} />
                    <Count label="Vừa" n={t.active.medium} />
                    <Count label="Khó" n={t.active.hard} />
                    <Count label="Đã ẩn" n={t.archived} />
                    <div className="col-span-4 md:col-span-1">
                      <TopicStatusChip total={activeTotal(t.active)} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <AddTopicDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}

// Nhãn hiện ở mobile (không có hàng tiêu đề), đọc màn hình luôn có.
function Count({ label, n }: { label: string; n: number }) {
  return (
    <p className="text-sm tabular-nums">
      <span className="text-xs text-muted-foreground md:sr-only">{label} </span>
      {n}
    </p>
  );
}

// Tìm topic có sẵn (GET /topics?q=) rồi sang trang topic để soạn câu.
function AddTopicDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{ id: string; name: string }[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || !q.trim()) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      searchTopics(q.trim(), ctrl.signal).then(
        (d) => {
          setFailed(false);
          setResults(d);
        },
        () => {
          if (!ctrl.signal.aborted) setFailed(true);
        },
      );
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  const shown = q.trim() ? results : null;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setQ('');
          setResults(null);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm topic</DialogTitle>
          <DialogDescription>Tìm topic rồi chọn để mở trang soạn câu hỏi.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm topic, ví dụ React" aria-label="Tìm topic" className="pl-8" autoFocus />
        </div>
        <div aria-live="polite" className="max-h-72 overflow-y-auto">
          {failed ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Không tìm được topic, thử lại.</p>
          ) : shown === null ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nhập tên topic để tìm.</p>
          ) : shown.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Không có topic nào khớp.</p>
          ) : (
            <ul className="flex flex-col">
              {shown.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    onClick={() => router.push(`/admin/skill-bank/${t.id}`)}
                  >
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
