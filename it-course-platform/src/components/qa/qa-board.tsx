// src/components/qa/qa-board.tsx — dữ liệu cho UI Hỏi đáp kiểu bình luận: tải trang, gửi lạc quan, xoá có xác nhận.
'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { QaListSkeleton } from '@/components/skeletons/qa-list-skeleton';
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
import { apiMessage } from '@/lib/api/checkout';
import { authClient } from '@/lib/auth-client';
import type { Answer, QaAuthor, Question, QuestionPage } from '@/types/qa';
import { Composer, Thread, type LocalAnswer, type LocalQuestion, type ThreadHandlers } from './qa-thread';

// Cùng một UI cho học viên và giảng viên, khác nhau ở bộ hàm gọi API.
export type QaApi = {
  list: (cursor?: string) => Promise<QuestionPage>;
  ask?: (body: string) => Promise<Question>; // không có → ẩn ô đặt câu hỏi (trang giảng viên)
  answer: (questionId: string, body: string, replyToAnswerId?: string) => Promise<Answer>;
  removeQuestion: (questionId: string) => Promise<void>;
  removeAnswer: (answerId: string) => Promise<void>;
};

type Target = { question: LocalQuestion; answer?: LocalAnswer };

const fromAnswer = (a: Answer, key = a.id): LocalAnswer => ({ ...a, key, status: 'sent' });
const fromServer = (q: Question, key = q.id): LocalQuestion => ({
  ...q,
  key,
  status: 'sent',
  answers: q.answers.map((a) => fromAnswer(a)),
});
const tmpId = () => `tmp-${crypto.randomUUID()}`;

export function QaBoard({
  api,
  title,
  empty,
  context,
}: {
  api: QaApi;
  title: string;
  empty: string;
  context?: (q: LocalQuestion) => ReactNode; // dòng "Khoá · Bài" ở trang giảng viên
}) {
  const { data: session } = authClient.useSession();
  const me: QaAuthor = { id: session?.user.id ?? '', name: session?.user.name ?? '', image: session?.user.image ?? null };
  const [items, setItems] = useState<LocalQuestion[] | null>(null);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reload, setReload] = useState(0);
  const [target, setTarget] = useState<Target | null>(null); // giữ cả lúc hộp thoại đang đóng để chữ không nhảy
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inflight = useRef(new Set<string>()); // chặn bấm "Thử lại" 2 lần trước khi kịp render "Đang gửi…"

  useEffect(() => {
    let cancelled = false;
    api.list().then(
      (p) => { if (!cancelled) { setItems(p.items.map((q) => fromServer(q))); setTotal(p.total); setCursor(p.nextCursor); } },
      (e) => { if (!cancelled) setError(apiMessage(e, 'Không tải được hỏi đáp')); },
    );
    return () => { cancelled = true; };
  }, [api, reload]);

  // Tìm theo key (ổn định qua lúc đổi id tạm → id thật). fn trả null = bỏ phần tử.
  const patchQuestion = (key: string, fn: (q: LocalQuestion) => LocalQuestion | null) =>
    setItems((l) => l && l.flatMap((q) => (q.key === key ? (fn(q) ?? []) : [q])));
  const patchAnswer = (qKey: string, aKey: string, fn: (a: LocalAnswer) => LocalAnswer | null) =>
    patchQuestion(qKey, (q) => ({ ...q, answers: q.answers.flatMap((a) => (a.key === aKey ? (fn(a) ?? []) : [a])) }));

  async function send(key: string, run: () => Promise<void>) {
    if (inflight.current.has(key)) return;
    inflight.current.add(key);
    try {
      await run();
    } finally {
      inflight.current.delete(key);
    }
  }

  const sendQuestion = (q: LocalQuestion) =>
    send(q.key, async () => {
      if (!api.ask) return;
      patchQuestion(q.key, (x) => ({ ...x, status: 'sending' }));
      try {
        const saved = await api.ask(q.body);
        patchQuestion(q.key, () => fromServer(saved, q.key));
        setTotal((n) => n + 1);
      } catch (e) {
        patchQuestion(q.key, (x) => ({ ...x, status: 'failed' }));
        toast.error(apiMessage(e, 'Không gửi được câu hỏi'));
      }
    });

  // Chỉ trả lời được câu hỏi đã gửi xong (nút "Trả lời" khoá khi đang gửi / gửi lỗi) → q.id là id thật.
  const sendAnswer = (q: LocalQuestion, a: LocalAnswer) =>
    send(a.key, async () => {
      patchAnswer(q.key, a.key, (x) => ({ ...x, status: 'sending' }));
      try {
        const saved = await api.answer(q.id, a.body, a.replyToAnswerId);
        patchAnswer(q.key, a.key, () => fromAnswer(saved, a.key));
      } catch (e) {
        patchAnswer(q.key, a.key, (x) => ({ ...x, status: 'failed' }));
        toast.error(apiMessage(e, 'Không gửi được câu trả lời'));
      }
    });

  function ask(content: string) {
    const id = tmpId();
    const q: LocalQuestion = {
      id,
      key: id,
      body: content,
      createdAt: new Date().toISOString(),
      item: null,
      course: { id: '', title: '', slug: '' },
      author: me,
      canDelete: true,
      status: 'sending',
      answers: [],
    };
    setItems((l) => [q, ...(l ?? [])]);
    void sendQuestion(q);
    // Ô hỏi nằm cuối, câu mới nằm đầu danh sách → cuộn tới để người gửi thấy.
    requestAnimationFrame(() => document.getElementById(q.key)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }

  const handlers: ThreadHandlers = {
    onAnswer: (q, content, replyTarget) => {
      const id = tmpId();
      const a: LocalAnswer = {
        id,
        key: id,
        body: content,
        createdAt: new Date().toISOString(),
        author: me,
        isInstructor: false, // server trả giá trị thật khi gửi xong
        replyTo: replyTarget ? { id: replyTarget.author.id, name: replyTarget.author.name } : null,
        replyToAnswerId: replyTarget?.id,
        canDelete: true,
        status: 'sending',
      };
      patchQuestion(q.key, (x) => ({ ...x, answers: [...x.answers, a] }));
      void sendAnswer(q, a);
    },
    onRetry: (q, a) => void (a ? sendAnswer(q, a) : sendQuestion(q)),
    onDelete: (q, a) => {
      // Gửi lỗi = chưa có trên server → bỏ khỏi màn hình luôn.
      if ((a ?? q).status === 'failed') return a ? patchAnswer(q.key, a.key, () => null) : patchQuestion(q.key, () => null);
      setTarget({ question: q, answer: a });
      setConfirming(true);
    },
  };

  async function confirmDelete() {
    if (!target || deleting) return;
    const { question: q, answer: a } = target;
    setDeleting(true);
    try {
      if (a) {
        await api.removeAnswer(a.id);
        patchAnswer(q.key, a.key, () => null);
      } else {
        await api.removeQuestion(q.id);
        patchQuestion(q.key, () => null);
        setTotal((n) => Math.max(0, n - 1));
      }
      setConfirming(false);
    } catch (e) {
      toast.error(apiMessage(e, 'Không xoá được'));
    } finally {
      setDeleting(false);
    }
  }

  async function more() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const p = await api.list(cursor);
      setItems((l) => [...(l ?? []), ...p.items.map((q) => fromServer(q))]);
      setCursor(p.nextCursor);
    } catch (e) {
      toast.error(apiMessage(e, 'Không tải thêm được câu hỏi'));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section className="max-w-2xl">
      <h2 className="mb-3 text-base font-semibold text-foreground">
        {title} {items && <span className="font-normal text-muted-foreground">{total}</span>}
      </h2>
      {error ? (
        <div role="alert" className="flex flex-col items-start gap-2 py-6 text-sm text-destructive">
          {error}
          <Button variant="outline" size="sm" onClick={() => { setError(null); setReload((n) => n + 1); }}>Thử lại</Button>
        </div>
      ) : !items ? (
        <QaListSkeleton />
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="divide-y divide-border">
          {items.map((q) => (
            <div key={q.key} id={q.key}>
              {context?.(q)}
              <Thread root={q} me={me} handlers={handlers} />
            </div>
          ))}
        </div>
      )}
      {cursor && (
        <Button variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground" disabled={loadingMore} onClick={() => void more()}>
          {loadingMore ? 'Đang tải…' : 'Xem thêm câu hỏi'}
        </Button>
      )}
      {/* Chỉ cho hỏi khi danh sách đã tải xong (không bị lần tải đầu ghi đè câu vừa gửi) và đã có session (tên + avatar). */}
      {api.ask && items && session && (
        <div className="mt-5 border-t border-border pt-5">
          <Composer me={me} placeholder="Đặt câu hỏi về bài học…" submitLabel="Gửi câu hỏi" onSubmit={ask} />
        </div>
      )}

      <AlertDialog open={confirming} onOpenChange={(o) => { if (!o) setConfirming(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{target?.answer ? 'Xoá bình luận này?' : 'Xoá câu hỏi này?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.answer ? 'Không hoàn tác được.' : 'Mọi trả lời của câu hỏi cũng bị xoá. Không hoàn tác được.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Huỷ</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
              Xoá
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
