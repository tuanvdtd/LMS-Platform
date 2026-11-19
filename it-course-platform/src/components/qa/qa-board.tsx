// src/components/qa/qa-board.tsx — dữ liệu cho UI Hỏi đáp kiểu bình luận: tải trang, gửi lạc quan, xoá có xác nhận.
'use client';

import { type ReactNode, useEffect, useEffectEvent, useRef, useState } from 'react';
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
import { apiErrorCode } from '@/lib/api/learn-quiz';
import { authClient } from '@/lib/auth-client';
import type { Answer, QaAuthor, Question, QuestionPage } from '@/types/qa';
import { Composer, Thread, type LocalAnswer, type LocalQuestion, type RoleOf, type ThreadHandlers } from './qa-thread';

// Chữ khác nhau giữa Hỏi đáp và bình luận bài viết.
export type QaCopy = {
  askPlaceholder: string;
  askSubmit: string;
  more: string;
  loadError: string;
  moreError: string;
  sendError: string;
  openError: string;
  notFound: string;
  notFoundCode: string;
  deleteRootTitle: string;
  deleteRootDescription: string;
};

const QA_COPY: QaCopy = {
  askPlaceholder: 'Đặt câu hỏi về bài học…',
  askSubmit: 'Gửi câu hỏi',
  more: 'Xem thêm câu hỏi',
  loadError: 'Không tải được hỏi đáp',
  moreError: 'Không tải thêm được câu hỏi',
  sendError: 'Không gửi được câu hỏi',
  openError: 'Không mở được câu hỏi',
  notFound: 'Câu hỏi này đã bị xoá',
  notFoundCode: 'QUESTION_NOT_FOUND',
  deleteRootTitle: 'Xoá câu hỏi này?',
  deleteRootDescription: 'Mọi trả lời của câu hỏi cũng bị xoá. Không hoàn tác được.',
};

// Cùng một UI cho học viên và giảng viên, khác nhau ở bộ hàm gọi API.
export type QaApi = {
  list: (cursor?: string) => Promise<QuestionPage>;
  get?: (questionId: string) => Promise<Question>; // mở 1 câu hỏi từ thông báo khi nó không nằm trong trang đầu
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
  focus,
  copy,
  composerOnTop = false,
  countReplies = false,
  roleOf,
  guestPrompt,
  autoLoadMore = false,
  bubble = false,
}: {
  api: QaApi;
  title: string;
  empty: string;
  context?: (q: LocalQuestion) => ReactNode; // dòng "Khoá · Bài" ở trang giảng viên
  focus?: { questionId: string; answerId?: string }; // mở từ thông báo: ghim câu hỏi, cuộn tới câu trả lời
  copy?: Partial<QaCopy>;
  composerOnTop?: boolean; // danh sách mới nhất trước → ô viết nằm trên, gần chỗ bình luận mới hiện ra
  countReplies?: boolean; // số cạnh tiêu đề tính cả trả lời (bình luận bài viết)
  roleOf?: RoleOf;
  guestPrompt?: ReactNode; // chưa đăng nhập: hiện ở chỗ ô viết
  autoLoadMore?: boolean; // cuộn tới cuối danh sách là tự tải tiếp (bình luận trong drawer); mặc định là nút "Xem thêm"
  bubble?: boolean; // bình luận dạng bong bóng, không kẻ ngang; ô viết thu một dòng (bình luận ngắn, nhiều)
}) {
  const t = { ...QA_COPY, ...copy };
  const { data: session, isPending } = authClient.useSession();
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
  // Câu hỏi đang mở từ thông báo; token đổi → remount Thread để mở rộng + cuộn lại.
  const [pin, setPin] = useState<{ questionId: string; answerId?: string; token: number } | null>(null);
  const handled = useRef<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [moreFailed, setMoreFailed] = useState(false); // lỗi khi tự tải → chờ người dùng bấm "Thử lại", không tự gọi lại liên tục

  const loadError = t.loadError; // chuỗi: ổn định giữa các lần render, khác object t
  useEffect(() => {
    let cancelled = false;
    api.list().then(
      (p) => { if (!cancelled) { setItems(p.items.map((q) => fromServer(q))); setTotal(p.total); setCursor(p.nextCursor); } },
      (e) => { if (!cancelled) setError(apiMessage(e, loadError)); },
    );
    return () => { cancelled = true; };
  }, [api, reload, loadError]);

  const openFocus = useEffectEvent(async (f: { questionId: string; answerId?: string }) => {
    // Nhường 1 microtask: setState không chạy đồng bộ trong effect.
    await Promise.resolve();
    if (!items?.some((q) => q.id === f.questionId)) {
      if (!api.get) return;
      try {
        const saved = await api.get(f.questionId);
        // Ghim lên đầu; "Xem thêm câu hỏi" sau này không thêm trùng (xem more()).
        setItems((l) => (l && !l.some((q) => q.id === saved.id) ? [fromServer(saved), ...l] : l));
      } catch (e) {
        toast.error(apiErrorCode(e) === t.notFoundCode ? t.notFound : t.openError);
        return;
      }
    }
    setPin({ ...f, token: Date.now() });
  });

  useEffect(() => {
    if (!focus || !items) return;
    const token = `${focus.questionId}:${focus.answerId ?? ''}`;
    if (handled.current === token) return;
    handled.current = token;
    void openFocus(focus);
  }, [focus, items]);

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
        toast.error(apiMessage(e, t.sendError));
      }
    });

  // Chỉ trả lời được câu hỏi đã gửi xong (nút "Trả lời" khoá khi đang gửi / gửi lỗi) → q.id là id thật.
  const sendAnswer = (q: LocalQuestion, a: LocalAnswer) =>
    send(a.key, async () => {
      patchAnswer(q.key, a.key, (x) => ({ ...x, status: 'sending' }));
      try {
        const saved = await api.answer(q.id, a.body, a.replyToAnswerId);
        patchAnswer(q.key, a.key, () => fromAnswer(saved, a.key));
        if (countReplies) setTotal((n) => n + 1);
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
    // Ô hỏi nằm cuối, câu mới nằm đầu danh sách → cuộn tới để người gửi thấy. Ô viết ở trên thì câu mới đã ngay dưới nó.
    if (!composerOnTop) {
      requestAnimationFrame(() => document.getElementById(q.key)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
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
        replyTo: replyTarget ? { id: replyTarget.author.id, name: replyTarget.author.name, answerId: replyTarget.id } : null,
        replyToAnswerId: replyTarget?.id,
        canDelete: true,
        status: 'sending',
      };
      patchQuestion(q.key, (x) => ({ ...x, answers: [...x.answers, a] }));
      void sendAnswer(q, a);
      return a.key;
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
        if (countReplies) setTotal((n) => Math.max(0, n - 1));
      } else {
        await api.removeQuestion(q.id);
        patchQuestion(q.key, () => null);
        // Server xoá luôn các trả lời của gốc; chỉ trừ những trả lời đã gửi xong.
        const replies = countReplies ? q.answers.filter((x) => x.status === 'sent').length : 0;
        setTotal((n) => Math.max(0, n - 1 - replies));
      }
      setConfirming(false);
    } catch (e) {
      toast.error(apiMessage(e, 'Không xoá được'));
    } finally {
      setDeleting(false);
    }
  }

  const moreInflight = useRef(false); // state loadingMore chưa kịp cập nhật khi observer gọi 2 lần liền
  async function more() {
    if (!cursor || moreInflight.current) return;
    moreInflight.current = true;
    setLoadingMore(true);
    try {
      const p = await api.list(cursor);
      setItems((l) => {
        const have = new Set((l ?? []).map((q) => q.id));
        return [...(l ?? []), ...p.items.filter((q) => !have.has(q.id)).map((q) => fromServer(q))];
      });
      setCursor(p.nextCursor);
    } catch (e) {
      toast.error(apiMessage(e, t.moreError));
      setMoreFailed(true);
    } finally {
      moreInflight.current = false;
      setLoadingMore(false);
    }
  }

  // Cuộn vô hạn: mốc cuối danh sách lọt vào tầm nhìn thì tải trang sau. Gắn lại khi cursor đổi:
  // trang vừa tải chưa lấp đầy khung thì mốc vẫn đang hiện → tải tiếp ngay.
  const loadMore = useEffectEvent(() => void more());
  useEffect(() => {
    const el = sentinel.current;
    if (!autoLoadMore || !el || !cursor || moreFailed) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore();
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [autoLoadMore, cursor, moreFailed, items]);

  // Chỉ cho viết khi danh sách đã tải xong (không bị lần tải đầu ghi đè bài vừa gửi) và đã có session (tên + avatar).
  const askBox =
    api.ask && items && (session ? <Composer me={me} placeholder={t.askPlaceholder} submitLabel={t.askSubmit} collapsible={bubble} onSubmit={ask} /> : guestPrompt);

  return (
    <section className="max-w-2xl">
      <h2 className="mb-3 text-base font-semibold text-foreground">
        {title} {items && <span className="font-normal text-muted-foreground">{total}</span>}
      </h2>
      {composerOnTop && askBox && <div className="mb-5">{askBox}</div>}
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
        <div className={bubble ? 'flex flex-col gap-3' : 'divide-y divide-border'}>
          {items.map((q) => (
            <div key={q.key} id={q.key}>
              {context?.(q)}
              <Thread
                key={pin?.questionId === q.id ? pin.token : 'thread'}
                root={q}
                me={me}
                handlers={handlers}
                focus={pin?.questionId === q.id ? pin : undefined}
                roleOf={roleOf}
                // Lúc session đang tải vẫn hiện "Trả lời" như trước; chỉ khách thật mới ẩn.
                canReply={!!session || isPending}
                bubble={bubble}
              />
            </div>
          ))}
        </div>
      )}
      {cursor && autoLoadMore && items && (
        moreFailed ? (
          <Button variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground" onClick={() => { setMoreFailed(false); void more(); }}>
            Thử lại
          </Button>
        ) : (
          <div ref={sentinel} className="flex justify-center py-4 text-sm text-muted-foreground" role="status">
            {loadingMore && 'Đang tải thêm…'}
          </div>
        )
      )}
      {cursor && !autoLoadMore && (
        <Button variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground" disabled={loadingMore} onClick={() => void more()}>
          {loadingMore ? 'Đang tải…' : t.more}
        </Button>
      )}
      {!composerOnTop && askBox && <div className="mt-5 border-t border-border pt-5">{askBox}</div>}

      <AlertDialog open={confirming} onOpenChange={(o) => { if (!o) setConfirming(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{target?.answer ? 'Xoá bình luận này?' : t.deleteRootTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.answer ? 'Không hoàn tác được.' : t.deleteRootDescription}
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
