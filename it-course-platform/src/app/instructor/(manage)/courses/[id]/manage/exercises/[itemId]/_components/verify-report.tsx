'use client';

import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { VerdictBadge } from '@/components/shared/product-ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { type ExerciseTest, LANGUAGES, type VerifyReport, verdictOf } from '@/types/exercise';

// Báo cáo "Kiểm tra lời giải": lời giải mẫu của từng ngôn ngữ chạy với mọi test.
// tests = bộ test đã lưu (verify chạy trên bản đã lưu) → lấy số thứ tự và công khai/ẩn.
export function VerifyReportView({
  report,
  tests,
  onUseOutput,
  onClose,
}: {
  report: VerifyReport;
  tests: ExerciseTest[];
  onUseOutput: (testCaseId: string, stdout: string) => void;
  onClose: () => void;
}) {
  const info = new Map(tests.map((t, i) => [t.id, { no: i + 1, isPublic: t.isPublic }]));
  // Có test sai/lỗi biên dịch thì luôn nói rõ, kể cả khi problems chỉ nêu test chạy chậm.
  const failing = report.languages.some((l) => l.compileError || l.tests.some((t) => t.status !== 'accepted'));

  return (
    <Card role="region" aria-label="Kết quả kiểm tra lời giải">
      <CardHeader>
        <CardTitle>Kết quả kiểm tra lời giải</CardTitle>
        <CardAction>
          <Button variant="ghost" size="icon" className="max-sm:size-11" aria-label="Đóng kết quả" onClick={onClose}>
            <X />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {report.passed ? (
          <Alert className="border-(--skill-strong) bg-(--skill-strong-bg) text-foreground">
            <CircleCheck />
            <AlertTitle>Lời giải pass toàn bộ test — bài đã được xuất bản</AlertTitle>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>Bài chưa được xuất bản</AlertTitle>
            <AlertDescription>
              {(failing || report.problems.length === 0) && (
                <p>Lời giải mẫu chưa pass toàn bộ test. Sửa lời giải hoặc output mong đợi rồi lưu và kiểm tra lại.</p>
              )}
              {report.problems.length > 0 && (
                <ul className="list-disc pl-4">
                  {report.problems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        {report.languages.map((lang) => {
          const passed = lang.tests.filter((t) => t.status === 'accepted').length;
          return (
            <section key={lang.language} className="flex flex-col gap-2">
              <h3 className="flex flex-wrap items-baseline gap-x-3 text-base font-semibold">
                {LANGUAGES[lang.language]}
                {!lang.compileError && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {passed}/{lang.tests.length} test đạt
                  </span>
                )}
              </h3>
              {lang.compileError ? (
                <div className="flex flex-col gap-1.5">
                  <VerdictBadge verdict="CE" />
                  <pre className="max-h-60 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
                    {lang.compileError}
                  </pre>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">STT</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Kết quả</TableHead>
                      <TableHead className="text-right">Thời gian</TableHead>
                      <TableHead>Output thật</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lang.tests.map((t) => {
                      const meta = info.get(t.testCaseId);
                      return (
                        <TableRow key={t.testCaseId}>
                          <TableCell className="px-3 py-2">{meta?.no ?? '–'}</TableCell>
                          <TableCell className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                            {meta ? (meta.isPublic ? 'Công khai' : 'Ẩn') : '–'}
                          </TableCell>
                          <TableCell className="px-3 py-2 whitespace-nowrap">
                            <VerdictBadge verdict={verdictOf(t.status)} />
                          </TableCell>
                          <TableCell
                            className={cn('px-3 py-2 text-right font-mono whitespace-nowrap', t.slow && 'text-destructive')}
                          >
                            {t.timeMs === null ? '–' : `${t.timeMs} ms`}
                            {t.slow && <span className="block font-sans text-xs">quá sát giới hạn</span>}
                          </TableCell>
                          <TableCell className="min-w-48 px-3 py-2">
                            <div className="flex flex-col items-start gap-1.5">
                              <pre className="max-h-32 w-full max-w-sm overflow-auto rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
                                {t.stdout || <span className="text-muted-foreground italic">(trống)</span>}
                              </pre>
                              {t.status === 'wrong_answer' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="max-sm:h-11"
                                  aria-label={`Dùng output này làm output mong đợi của test ${meta?.no ?? ''}`}
                                  onClick={() => onUseOutput(t.testCaseId, t.stdout)}
                                >
                                  Dùng output này
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
