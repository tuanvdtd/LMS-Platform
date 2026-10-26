'use client';

import { useCallback, useState } from 'react';
import { CheckIcon, CircleHelpIcon, CodeIcon, FileTextIcon, PlayCircleIcon, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { VideoPreviewDialog } from '@/app/instructor/(manage)/courses/[id]/manage/_components/curriculum/video-preview-dialog';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/markdown';
import { getApprovalAssetUrl } from '@/lib/api/course-approvals';
import {
  formatDuration,
  ITEM_TYPE_LABEL,
  type AssetRef,
  type CurriculumItem,
  type CurriculumSection,
  type ItemType,
  type QuizDetail,
} from '@/types/curriculum';

const ICON: Record<ItemType, LucideIcon> = {
  lecture: PlayCircleIcon,
  quiz: CircleHelpIcon,
  practice_test: CircleHelpIcon,
  coding_exercise: CodeIcon,
};

// Giáo trình để admin xem trước khi duyệt. Asset lấy qua URL ký của admin.
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

  function renderItem(item: CurriculumItem) {
    const Icon = ICON[item.type];
    const quiz = quizzes[item.id];
    return (
      <li key={item.id} className="space-y-2 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 font-medium">{item.title}</span>
          <span className="text-xs text-muted-foreground">
            {ITEM_TYPE_LABEL[item.type]}
            {item.video && item.durationSec > 0 && ` · ${formatDuration(item.durationSec)}`}
          </span>
          {item.video && (
            <Button size="sm" variant="outline" onClick={() => setVideo(item.video)}>
              Xem
            </Button>
          )}
          {item.document && (
            <Button size="sm" variant="outline" onClick={() => openPdf(item.document!.id)}>
              <FileTextIcon data-icon="inline-start" />
              Mở PDF
            </Button>
          )}
          {quiz && (
            <Button size="sm" variant="outline" aria-expanded={openQuiz === item.id} onClick={() => setOpenQuiz(openQuiz === item.id ? null : item.id)}>
              {openQuiz === item.id ? 'Ẩn câu hỏi' : 'Xem câu hỏi'}
            </Button>
          )}
        </div>

        {item.resources.length > 0 && (
          <ul className="flex flex-col gap-1 pl-7 text-sm">
            {item.resources.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{r.title}</span>
                <Button size="sm" variant="ghost" onClick={() => openPdf(r.asset.id)}>
                  Mở PDF
                </Button>
              </li>
            ))}
          </ul>
        )}

        {quiz && openQuiz === item.id && (
          <ol className="space-y-4 rounded-xl border bg-muted/30 p-4">
            {quiz.questions.length === 0 && <li className="text-sm text-muted-foreground">Chưa có câu hỏi.</li>}
            {quiz.questions.map((q, qi) => (
              <li key={q.id} className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-sm font-semibold">{qi + 1}.</span>
                  <Markdown className="min-w-0 flex-1">{q.stem}</Markdown>
                </div>
                <ul className="space-y-1 pl-6">
                  {q.options.map((o) => (
                    <li key={o.id} className="text-sm">
                      <div className="flex items-start gap-2">
                        {o.isCorrect ? (
                          <CheckIcon className="mt-0.5 size-4 shrink-0 text-green-600" aria-label="Đáp án đúng" />
                        ) : (
                          <span className="size-4 shrink-0" aria-hidden />
                        )}
                        <span className={o.isCorrect ? 'font-medium' : undefined}>{o.content}</span>
                      </div>
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

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">Giáo trình</h2>
      {sections.map((s, i) => (
        <details key={s.id} open className="rounded-2xl border bg-card px-5">
          <summary className="cursor-pointer py-3 font-semibold">
            Phần {i + 1}: {s.title}
          </summary>
          <ul className="divide-y border-t text-sm">{s.items.map(renderItem)}</ul>
        </details>
      ))}
      <VideoPreviewDialog asset={video} onClose={() => setVideo(null)} loadUrl={loadUrl} />
    </section>
  );
}
