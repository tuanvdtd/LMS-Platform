'use client';

import { useCallback, useState } from 'react';
import { Check, ChevronDown, CircleHelp, Code, ExternalLink, FileText, Paperclip, PlayCircle, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { VideoPreviewDialog } from '@/app/instructor/(manage)/courses/[id]/manage/_components/curriculum/video-preview-dialog';
import { Markdown } from '@/components/markdown';
import { Button } from '@/components/ui/button';
import { getApprovalAssetUrl } from '@/lib/api/course-approvals';
import { cn } from '@/lib/utils';
import { type AssetRef, type CurriculumItem, type CurriculumSection, formatDuration, ITEM_TYPE_LABEL, type QuizDetail } from '@/types/curriculum';
import { Panel } from '../../../_components/review-ui';

// Màu chỉ để phân loại nội dung (DESIGN: bài giảng primary, quiz tertiary, bài code cam đất).
function kindOf(item: CurriculumItem): { icon: LucideIcon; className: string } {
  if (item.type === 'lecture') return item.document ? { icon: FileText, className: 'bg-primary-soft text-primary' } : { icon: PlayCircle, className: 'bg-primary-soft text-primary' };
  if (item.type === 'coding_exercise') return { icon: Code, className: 'bg-brand-accent-soft text-brand-accent-strong' };
  return { icon: CircleHelp, className: 'bg-tertiary-soft text-tertiary' };
}

// "1 giờ 23 phút" / "48 phút".
const totalTime = (sec: number) => {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} phút` : `${Math.floor(m / 60)} giờ${m % 60 ? ` ${m % 60} phút` : ''}`;
};

// Giáo trình để người duyệt xem trước. Asset lấy qua URL ký của admin.
export function CurriculumReview({
  approvalId,
  sections,
  quizzes,
}: {
  approvalId: string;
  sections: CurriculumSection[];
  quizzes: Record<string, QuizDetail>;
}) {
  const [video, setVideo] = useState<AssetRef | null>(null);
  // useCallback: loadUrl nằm trong deps effect của Player, đổi tham chiếu sẽ tải lại video.
  const loadUrl = useCallback((assetId: string) => getApprovalAssetUrl(approvalId, assetId), [approvalId]);
  const [openQuiz, setOpenQuiz] = useState<string | null>(null);

  const items = sections.flatMap((s) => s.items);
  const videoSec = items.reduce((t, i) => t + (i.video ? i.durationSec : 0), 0);
  const count = (type: CurriculumItem['type']) => items.filter((i) => i.type === type).length;
  const summary = [
    `${sections.length} phần`,
    `${count('lecture')} bài giảng`,
    videoSec > 0 && `${totalTime(videoSec)} video`,
    count('quiz') + count('practice_test') > 0 && `${count('quiz') + count('practice_test')} quiz`,
    count('coding_exercise') > 0 && `${count('coding_exercise')} bài code`,
  ]
    .filter(Boolean)
    .join(' · ');

  // Mở tab trước khi await để trình duyệt không chặn popup, rồi trỏ tới URL ký.
  async function openPdf(assetId: string) {
    const tab = window.open('', '_blank');
    try {
      const { url } = await getApprovalAssetUrl(approvalId, assetId);
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      }
    } catch {
      tab?.close();
      toast.error('Không mở được tệp, thử lại');
    }
  }

  function renderItem(item: CurriculumItem, n: number) {
    const { icon: Icon, className } = kindOf(item);
    const quiz = quizzes[item.id];
    const open = openQuiz === item.id;
    const empty = item.type === 'lecture' && !item.video && !item.document;
    return (
      <li key={item.id} className="flex flex-col gap-3 px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', className)}>
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-pretty text-foreground">
              <span className="text-muted-foreground tabular-nums">{n}.</span> {item.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {ITEM_TYPE_LABEL[item.type]}
              {item.video && item.durationSec > 0 && (
                <>
                  {' · '}
                  <span className="font-mono tabular-nums">{formatDuration(item.durationSec)}</span>
                </>
              )}
              {quiz && ` · ${quiz.questions.length} câu hỏi`}
              {empty && <span className="font-medium text-warning"> · Chưa có nội dung</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.video && (
              <Button size="sm" variant="outline" onClick={() => setVideo(item.video)}>
                <PlayCircle data-icon="inline-start" />
                Xem video
              </Button>
            )}
            {item.document && (
              <Button size="sm" variant="outline" onClick={() => openPdf(item.document!.id)}>
                <ExternalLink data-icon="inline-start" />
                Mở PDF
              </Button>
            )}
            {quiz && (
              <Button size="sm" variant="outline" aria-expanded={open} onClick={() => setOpenQuiz(open ? null : item.id)}>
                <ChevronDown data-icon="inline-start" className={cn('transition-transform motion-reduce:transition-none', open && 'rotate-180')} />
                {open ? 'Ẩn câu hỏi' : 'Xem câu hỏi'}
              </Button>
            )}
          </div>
        </div>

        {item.resources.length > 0 && (
          <ul className="ml-11 flex flex-col gap-1">
            {item.resources.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => openPdf(r.asset.id)}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-1.5 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Paperclip className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{r.title}</span>
                  <ExternalLink className="size-3 shrink-0" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        {quiz && open && (
          <ol className="ml-11 flex flex-col gap-4 border-l py-1 pl-4">
            {quiz.questions.length === 0 && <li className="text-sm text-muted-foreground">Quiz chưa có câu hỏi.</li>}
            {quiz.questions.map((q, qi) => (
              <li key={q.id} className="flex flex-col gap-2">
                <div className="flex gap-2 text-sm">
                  <span className="font-semibold text-foreground tabular-nums">{qi + 1}.</span>
                  <Markdown className="min-w-0 flex-1">{q.stem}</Markdown>
                </div>
                <ul className="flex flex-col gap-1 pl-5">
                  {q.options.map((o) => (
                    <li key={o.id} className="flex flex-col gap-0.5 text-sm">
                      <span className={cn('flex items-start gap-2', o.isCorrect ? 'font-medium text-success' : 'text-foreground')}>
                        {o.isCorrect ? (
                          <Check className="mt-0.5 size-4 shrink-0" aria-label="Đáp án đúng" />
                        ) : (
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden />
                        )}
                        <span className="min-w-0">{o.content}</span>
                      </span>
                      {o.explanation && <p className="pl-6 text-xs text-muted-foreground">{o.explanation}</p>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </li>
    );
  }

  let n = 0;
  return (
    <>
      <Panel title="Giáo trình" meta={summary} className="overflow-hidden [&>div]:p-0">
        {sections.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">Khoá chưa có phần nào.</p>
        ) : (
          sections.map((s, i) => (
            // Khoá ít phần: mở hết để lướt; nhiều phần: đóng sẵn, tránh bức tường bài.
            <details key={s.id} open={sections.length <= 4} className="group border-b last:border-b-0">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 bg-muted/50 px-5 py-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
                <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                  Phần {i + 1}: {s.title}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">{s.items.length} mục</span>
              </summary>
              {s.items.length === 0 ? (
                <p className="px-5 py-3 text-sm text-muted-foreground">Phần này chưa có bài.</p>
              ) : (
                <ul className="divide-y">{s.items.map((item) => renderItem(item, ++n))}</ul>
              )}
            </details>
          ))
        )}
      </Panel>
      <VideoPreviewDialog asset={video} onClose={() => setVideo(null)} loadUrl={loadUrl} />
    </>
  );
}
