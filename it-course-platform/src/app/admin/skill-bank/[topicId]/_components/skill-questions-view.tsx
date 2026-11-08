'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Eye, EyeOff, FileUp, MoreHorizontal, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  archiveSkillQuestion,
  importSkillQuestions,
  listSkillQuestions,
  listSkillTopics,
  restoreSkillQuestion,
} from '@/lib/api/skill-bank';
import { DIFFICULTY_LABEL } from '@/lib/skills';
import { QUESTION_TYPE_LABEL } from '@/types/curriculum';
import type { AdminSkillQuestion, AdminSkillTopic, SkillDifficulty } from '@/types/skills';
import { ImportQuestionsDialog } from '../../../../instructor/(manage)/courses/[id]/manage/_components/curriculum/import-questions-dialog';
import { BackLink } from '../../../_components/review-ui';
import { QueueMessage } from '../../../_components/queue';
import { csvToSkillQuestions } from '../../_components/skill-csv';
import { activeTotal, TopicStatusChip } from '../../_components/skill-topics-view';
import { SkillQuestionSheet } from './skill-question-sheet';

type Status = 'active' | 'archived';
type Filter = 'all' | SkillDifficulty;
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'easy', label: DIFFICULTY_LABEL.easy },
  { value: 'medium', label: DIFFICULTY_LABEL.medium },
  { value: 'hard', label: DIFFICULTY_LABEL.hard },
];

// Đề bài hiển thị 1 dòng: bỏ ký hiệu markdown (code fence, đậm, tiêu đề, link) cho dễ đọc.
const plain = (md: string) =>
  md
    .replace(/```[\w-]*\n?/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_#>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function SkillQuestionsView({ topicId }: { topicId: string }) {
  const [status, setStatus] = useState<Status>('active');
  const [filter, setFilter] = useState<Filter>('all');
  const [data, setData] = useState<{ name: string; questions: AdminSkillQuestion[] } | null>(null);
  const [stats, setStats] = useState<AdminSkillTopic | null | undefined>(undefined); // undefined = chưa tải; null = topic chưa có câu
  const [failed, setFailed] = useState<'not_found' | 'failed' | null>(null);
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<AdminSkillQuestion | null | undefined>(undefined); // undefined = đóng, null = câu mới
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let stale = false;
    listSkillQuestions(topicId, { status, difficulty: filter === 'all' ? undefined : filter }).then(
      (d) => {
        if (!stale) setData({ name: d.topic.name, questions: d.questions });
      },
      (e: unknown) => {
        if (!stale) setFailed(axios.isAxiosError(e) && e.response?.status === 404 ? 'not_found' : 'failed');
      },
    );
    return () => {
      stale = true;
    };
  }, [topicId, status, filter, reload]);

  useEffect(() => {
    let stale = false;
    listSkillTopics().then(
      (all) => {
        if (!stale) setStats(all.find((t) => t.id === topicId) ?? null);
      },
      () => undefined, // chip chỉ phụ trợ; bảng vẫn dùng được
    );
    return () => {
      stale = true;
    };
  }, [topicId, reload]);

  const refresh = () => {
    setData(null);
    setFailed(null);
    setReload((n) => n + 1);
  };
  const change = (fn: () => void) => {
    fn();
    setData(null);
    setFailed(null);
  };

  async function toggle(q: AdminSkillQuestion) {
    try {
      await (q.archivedAt ? restoreSkillQuestion(q.id) : archiveSkillQuestion(q.id));
      toast.success(q.archivedAt ? 'Đã hiện lại câu hỏi' : 'Đã ẩn câu hỏi');
      refresh();
    } catch {
      toast.error('Không cập nhật được câu hỏi, thử lại');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <BackLink href="/admin/skill-bank">Ngân hàng kỹ năng</BackLink>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {data ? (
              <h1 className="text-2xl font-extrabold text-balance text-foreground">{data.name}</h1>
            ) : (
              !failed && <Skeleton className="h-8 w-56" />
            )}
            {data && (stats !== undefined ? <TopicStatusChip total={stats ? activeTotal(stats.active) : 0} /> : <Skeleton className="h-6 w-36 rounded-full" />)}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={!data} onClick={() => setImporting(true)}>
              <FileUp data-icon="inline-start" /> Nhập CSV
            </Button>
            <Button disabled={!data} onClick={() => setEditing(null)}>
              <Plus data-icon="inline-start" /> Thêm câu
            </Button>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-3 sm:px-5">
          <Tabs value={status} onValueChange={(v) => change(() => setStatus(v as Status))}>
            <TabsList variant="line" aria-label="Lọc theo trạng thái" className="pb-[5px] group-data-horizontal/tabs:h-12">
              <TabsTrigger value="active" className="px-2 sm:px-3">
                Đang dùng
              </TabsTrigger>
              <TabsTrigger value="archived" className="px-2 sm:px-3">
                Đã ẩn
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <ToggleGroup
            variant="outline"
            aria-label="Lọc theo độ khó"
            value={[filter]}
            onValueChange={(v) => v[0] && change(() => setFilter(v[0] as Filter))}
            className="my-2"
          >
            {FILTERS.map((f) => (
              <ToggleGroupItem key={f.value} value={f.value} className="px-3 aria-pressed:bg-(--primary-light) aria-pressed:text-primary">
                {f.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {failed === 'not_found' ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="font-semibold text-foreground">Không tìm thấy topic</p>
            <Link href="/admin/skill-bank" className={buttonVariants({ variant: 'outline' })}>
              Về ngân hàng kỹ năng
            </Link>
          </div>
        ) : failed ? (
          <QueueMessage kind="error" title="Không tải được câu hỏi" text="Kiểm tra kết nối rồi thử lại." onRetry={refresh} />
        ) : !data ? (
          <div role="status" aria-busy="true" aria-label="Đang tải" className="divide-y">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="hidden h-4 w-20 md:block" />
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="hidden h-4 w-10 md:block" />
              </div>
            ))}
          </div>
        ) : data.questions.length === 0 ? (
          <QueueMessage
            kind="empty"
            title={status === 'active' ? 'Chưa có câu nào đang dùng' : 'Không có câu nào bị ẩn'}
            text={status === 'active' ? 'Bấm Thêm câu hoặc Nhập CSV để soạn câu hỏi cho topic này.' : 'Câu bị ẩn sẽ hiện ở đây, hiện lại được bất cứ lúc nào.'}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 pl-5">#</TableHead>
                <TableHead>Đề bài</TableHead>
                <TableHead className="hidden md:table-cell">Loại</TableHead>
                <TableHead>Độ khó</TableHead>
                <TableHead className="hidden text-right sm:table-cell">R</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Lượt trả lời</TableHead>
                <TableHead className="hidden text-right lg:table-cell">% đúng</TableHead>
                <TableHead className="w-12 pr-3">
                  <span className="sr-only">Thao tác</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.questions.map((q, i) => (
                <TableRow key={q.id}>
                  <TableCell className="pl-5 text-muted-foreground tabular-nums">{i + 1}</TableCell>
                  <TableCell className="max-w-0 w-full">
                    <p className="truncate font-medium text-foreground">{plain(q.stem)}</p>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap md:table-cell">{QUESTION_TYPE_LABEL[q.type]}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{DIFFICULTY_LABEL[q.difficulty]}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{Math.round(q.rating)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">{q.answerCount}</TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">
                    {q.answerCount === 0 ? '—' : `${Math.round((q.correctCount / q.answerCount) * 100)}%`}
                  </TableCell>
                  <TableCell className="pr-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Thao tác cho câu ${i + 1}`} className="size-11 sm:size-8" />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" positionMethod="fixed">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => setEditing(q)}>
                            <Pencil /> Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void toggle(q)}>
                            {q.archivedAt ? <Eye /> : <EyeOff />}
                            {q.archivedAt ? 'Hiện lại' : 'Ẩn'}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <SkillQuestionSheet
        open={editing !== undefined}
        onOpenChange={(o) => !o && setEditing(undefined)}
        topicId={topicId}
        question={editing ?? null}
        onSaved={refresh}
      />
      <ImportQuestionsDialog
        open={importing}
        onOpenChange={setImporting}
        current={0}
        disabled={false}
        scope="bank"
        max={200}
        parse={csvToSkillQuestions}
        templateHref="/templates/skill-questions.csv"
        onImport={async (questions) => {
          try {
            const { created } = await importSkillQuestions(topicId, questions);
            toast.success(`Đã nhập ${created} câu`);
            refresh();
            return true;
          } catch {
            toast.error('Nhập thất bại, thử lại');
            return false;
          }
        }}
      />
    </div>
  );
}
