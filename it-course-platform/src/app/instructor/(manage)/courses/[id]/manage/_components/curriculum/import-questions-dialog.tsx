'use client';

import { useState } from 'react';
import { Check, Download, FileUp } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type QuestionPayload, QUESTION_TYPE_LABEL, QUIZ_LIMITS } from '@/types/curriculum';
import { type CsvError, csvToQuestions } from './quiz-csv';

const MAX_BYTES = 1024 * 1024;

type Parsed = { fileName: string; questions: QuestionPayload[]; rows: number[]; errors: CsvError[] };

// Nhập câu hỏi từ CSV: đọc + kiểm tra ngay trên trình duyệt, xem trước (chỉ đọc), nhập tất cả hoặc không câu nào.
export function ImportQuestionsDialog({
  open,
  onOpenChange,
  current,
  disabled,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: number; // số câu đang có trong quiz
  disabled: boolean;
  onImport: (questions: QuestionPayload[]) => Promise<boolean>;
}) {
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const room = QUIZ_LIMITS.maxQuestions - current;
  const n = parsed?.questions.length ?? 0;
  const over = n > room;
  const canImport = !!parsed && !parsed.errors.length && n > 0 && !over && !disabled && !submitting;

  const change = (next: boolean) => {
    if (submitting) return; // đang nhập thì không đóng
    if (!next) setParsed(null); // đóng thì bỏ file đã chọn
    onOpenChange(next);
  };

  async function pick(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setParsed({ fileName: file.name, questions: [], rows: [], errors: [{ row: 0, message: 'File lớn hơn 1 MB' }] });
      return;
    }
    setParsed({ fileName: file.name, ...csvToQuestions(await file.text()) });
  }

  async function submit() {
    if (!parsed) return;
    setSubmitting(true);
    const ok = await onImport(parsed.questions);
    setSubmitting(false);
    if (ok) change(false);
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="max-h-[90dvh] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nhập câu hỏi từ CSV</DialogTitle>
          <DialogDescription>
            Câu hỏi được thêm vào cuối quiz (tối đa {QUIZ_LIMITS.maxQuestions} câu/quiz). Sửa file bằng Excel thì lưu
            lại bằng kiểu <strong>CSV UTF-8</strong>.
          </DialogDescription>
        </DialogHeader>
        <a
          href="/templates/quiz-questions.csv"
          download
          className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-11 self-start sm:h-8' })}
        >
          <Download data-icon="inline-start" /> Tải file mẫu
        </a>
        <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-[1.5px] border-dashed bg-background px-4 py-6 text-center text-sm has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
          <FileUp className="size-5 text-muted-foreground" aria-hidden />
          <span className="font-semibold break-all">{parsed ? parsed.fileName : 'Chọn file .csv'}</span>
          <span className="text-xs text-muted-foreground">Tối đa 1 MB</span>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={disabled || submitting}
            className="sr-only"
            onChange={(e) => {
              void pick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        {parsed && parsed.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc pl-4">
                {parsed.errors.map((e, i) => (
                  <li key={i}>
                    {e.row > 0 && `Dòng ${e.row}: `}
                    {e.message}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        {over && (
          <Alert variant="destructive">
            <AlertDescription>
              Quiz đang có {current} câu, chỉ còn chỗ cho {Math.max(0, room)} câu, nhưng file có {n} câu. Bớt câu trong
              file hoặc xoá câu cũ rồi nhập lại.
            </AlertDescription>
          </Alert>
        )}
        {parsed && n > 0 && (
          <ol className="flex flex-col gap-3">
            {parsed.questions.map((q, i) => (
              <li key={i} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  Dòng {parsed.rows[i]} <Badge variant="secondary">{QUESTION_TYPE_LABEL[q.type]}</Badge>
                </div>
                <Markdown>{q.stem}</Markdown>
                <ul className="mt-2 flex flex-col gap-1">
                  {q.options.map((o, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      {o.isCorrect ? (
                        <Check role="img" className="mt-0.5 size-4 shrink-0 text-primary" aria-label="Đáp án đúng" />
                      ) : (
                        <span className="size-4 shrink-0" aria-hidden />
                      )}
                      <span className={o.isCorrect ? 'font-semibold [overflow-wrap:anywhere]' : '[overflow-wrap:anywhere]'}>{o.content}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
        <DialogFooter className="sticky bottom-0 bg-popover">
          <Button variant="outline" className="h-11 sm:h-9" disabled={submitting} onClick={() => change(false)}>
            Huỷ
          </Button>
          <Button className="h-11 sm:h-9" disabled={!canImport} onClick={() => void submit()}>
            {submitting ? 'Đang nhập…' : `Nhập ${n} câu`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
