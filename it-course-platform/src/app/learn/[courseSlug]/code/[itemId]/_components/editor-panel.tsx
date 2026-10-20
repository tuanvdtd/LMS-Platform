'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, RotateCcw, Upload } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { type Language, LANGUAGES, type LearnExercise, MAX_CODE_BYTES } from '@/types/exercise';

export const CodeEditor = dynamic(() => import('@/components/code-editor').then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-60 w-full" />,
});

// Khung phải trên: chọn ngôn ngữ, Reset, editor, Chạy thử / Nộp bài.
// onCodeChange phải ổn định (setState) để CodeMirror không cấu hình lại mỗi lần gõ.
export function EditorPanel({
  exercise,
  language,
  onLanguageChange,
  code,
  onCodeChange,
  onReset,
  busy,
  grading,
  onRun,
  onSubmit,
  className,
}: {
  exercise: LearnExercise;
  language: Language;
  onLanguageChange: (language: Language) => void;
  code: string;
  onCodeChange: (code: string) => void;
  onReset: () => void;
  busy: 'run' | 'submit' | null;
  grading: boolean;
  onRun: () => void;
  onSubmit: () => void;
  className?: string;
}) {
  const [resetOpen, setResetOpen] = useState(false);
  const items = Object.fromEntries(exercise.languages.map((l) => [l, LANGUAGES[l]]));
  const tooLong = code.length > MAX_CODE_BYTES;
  const blocked = !code.trim() || tooLong || busy !== null;

  return (
    <section aria-label="Soạn code" className={cn('flex min-h-0 flex-col bg-card', className)}>
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-1.5">
        <Select items={items} value={language} onValueChange={(v) => v && onLanguageChange(v as Language)}>
          <SelectTrigger aria-label="Ngôn ngữ lập trình" className="w-36 max-md:h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {exercise.languages.map((l) => (
                <SelectItem key={l} value={l}>
                  {LANGUAGES[l]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          className="max-md:h-11"
          disabled={code === (exercise.starters[language] ?? '')}
          onClick={() => setResetOpen(true)}
        >
          <RotateCcw data-icon="inline-start" aria-hidden />
          Reset
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-2">
        <CodeEditor
          key={language}
          language={language}
          value={code}
          onChange={onCodeChange}
          height="100%"
          minHeight="12rem"
          ariaLabel={`Code ${LANGUAGES[language]} của bạn`}
          className="max-md:h-88 md:min-h-0 md:flex-1"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2">
        {tooLong ? (
          <p className="text-xs text-destructive" role="alert">
            Code dài quá {MAX_CODE_BYTES.toLocaleString('vi-VN')} ký tự, hãy rút gọn trước khi chạy.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground max-md:hidden">Trong ô code, nhấn Esc rồi Tab để rời khỏi ô.</p>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            className="max-md:h-11"
            isLoading={busy === 'run'}
            disabled={busy !== 'run' && blocked}
            onClick={onRun}
          >
            <Play data-icon="inline-start" aria-hidden />
            Chạy thử
          </Button>
          <Button
            className="max-md:h-11"
            isLoading={busy === 'submit'}
            disabled={busy !== 'submit' && (blocked || grading)}
            title={grading ? 'Đang chấm bài nộp trước' : undefined}
            onClick={onSubmit}
          >
            <Upload data-icon="inline-start" aria-hidden />
            Nộp bài
          </Button>
        </div>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đặt lại code?</AlertDialogTitle>
            <AlertDialogDescription>
              Code {LANGUAGES[language]} hiện tại và bản nháp sẽ bị xoá, editor quay về code khởi đầu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">Giữ code</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                onReset();
                setResetOpen(false);
              }}
            >
              Đặt lại
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
