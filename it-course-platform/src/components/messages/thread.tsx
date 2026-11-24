'use client';
// src/components/messages/thread.tsx — Khung chat: đầu, danh sách tin (cuộn/phân trang ngược), gửi lạc quan, đã xem, chặn.

import Link from 'next/link';
import axios from 'axios';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, Ellipsis, Info } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { blockConversation, getConversation, listMessages, markConversationRead, sendMessage, unblockConversation } from '@/lib/api/messages';
import { useMessageStore } from '@/lib/message-store';
import { groupMessages } from '@/lib/messages';
import { usePointerFocus } from '@/lib/use-pointer-focus';
import { cn } from '@/lib/utils';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Composer, type SendImage } from '@/components/messages/composer';
import { MessageBubble, type LocalMessage } from '@/components/messages/message-bubble';
import { ThreadSkeleton } from '@/components/messages/messages-skeleton';
import { UserAvatar } from '@/components/messages/user-avatar';
import type { CannotSend, ConversationDetail } from '@/types/message';

const NOTICE = 'Tin nhắn chỉ dành cho trao đổi riêng về khoá học. Không trao đổi quyền lợi để đổi đánh giá.';
const BOTTOM_GAP = 80; // px: coi là "đang ở đáy"

const errorMessage = (e: unknown, fallback: string) =>
  (axios.isAxiosError(e) && (e.response?.data as { message?: string } | undefined)?.message) || fallback;

// Trộn tin thật theo id, sắp cũ → mới; tin tạm (gửi lạc quan) luôn ở cuối.
function mergeMessages(prev: LocalMessage[], incoming: LocalMessage[]): LocalMessage[] {
  const map = new Map<string, LocalMessage>();
  for (const m of [...prev, ...incoming]) if (!m.status) map.set(m.id, m);
  const real = [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  return [...real, ...prev.filter((m) => m.status)];
}

const CANNOT_SEND_TEXT: Record<Exclude<CannotSend, 'BLOCKED_BY_ME'>, string> = {
  BLOCKED_BY_OTHER: 'Không thể gửi tin trong cuộc trò chuyện này.',
  NO_PAID_LINK: 'Hai bạn không còn khoá trả phí nào chung nên không gửi tin được.',
};

// key theo cuộc → đổi cuộc là dựng lại toàn bộ state.
export function Thread(props: { conversationId: string; basePath: string; contextSlot?: (d: ConversationDetail) => React.ReactNode; asideSlot?: (d: ConversationDetail) => React.ReactNode }) {
  return <ThreadInner key={props.conversationId} {...props} />;
}

function ThreadInner({ conversationId, basePath, contextSlot, asideSlot }: { conversationId: string; basePath: string; contextSlot?: (d: ConversationDetail) => React.ReactNode; asideSlot?: (d: ConversationDetail) => React.ReactNode }) {
  const me = authClient.useSession().data?.user.id ?? '';
  const meRef = useRef(me);
  useEffect(() => {
    meRef.current = me;
  }, [me]);
  const lastEvent = useMessageStore((s) => s.lastEvent);
  const pointer = usePointerFocus();

  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [confirm, setConfirm] = useState<'block' | 'unblock' | null>(null);
  const [busy, setBusy] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const scrollOp = useRef<{ type: 'bottom' } | { type: 'keep'; height: number; top: number } | null>(null);
  const olderBusy = useRef(false);
  const tmpSeq = useRef(0);
  const seenEvent = useRef(lastEvent);
  const readInflight = useRef(false);
  const readDirty = useRef(false);
  const needsRead = useRef(false);

  const reloadDetail = useCallback(() => getConversation(conversationId).then(setDetail).catch(() => {}), [conversationId]);

  // Đánh dấu đã đọc: gộp (đang gọi thì chỉ nhớ gọi lại 1 lần), tab ẩn thì hoãn tới khi hiện.
  const markRead = useCallback(() => {
    if (document.visibilityState !== 'visible') {
      needsRead.current = true;
      return;
    }
    needsRead.current = false;
    if (readInflight.current) {
      readDirty.current = true;
      return;
    }
    readInflight.current = true;
    void (async () => {
      try {
        do {
          readDirty.current = false;
          await markConversationRead(conversationId);
          // Sự kiện nội bộ: danh sách zero chưa đọc, store tải lại số badge ở header.
          useMessageStore.getState().onEvent({ type: 'conversation:read', conversationId, userId: meRef.current, readAt: new Date().toISOString() });
        } while (readDirty.current);
      } catch {
        /* lần sau thử lại */
      } finally {
        readInflight.current = false;
      }
    })();
  }, [conversationId]);

  // Tải lần đầu.
  const ready = me !== ''; // chưa biết mình là ai (session đang tải) thì chưa tải, tránh vẽ sai bên và tải hai lần
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    Promise.all([getConversation(conversationId), listMessages(conversationId)])
      .then(([d, page]) => {
        if (!alive) return;
        scrollOp.current = { type: 'bottom' };
        // Gộp với tin đến qua socket trong lúc đang tải; mốc đã xem giữ giá trị lớn hơn.
        setDetail((prev) => (prev?.otherLastReadAt && (!d.otherLastReadAt || prev.otherLastReadAt > d.otherLastReadAt) ? { ...d, otherLastReadAt: prev.otherLastReadAt } : d));
        setMessages((prev) => mergeMessages(prev, [...page.items].reverse()));
        setHasMore(page.hasMore);
        setStatus('ready');
        markRead();
      })
      .catch((e) => alive && setStatus(axios.isAxiosError(e) && [400, 404].includes(e.response?.status ?? 0) ? 'notfound' : 'error'));
    return () => {
      alive = false;
    };
  }, [conversationId, markRead, ready]);

  useEffect(() => {
    const onVis = () => needsRead.current && markRead();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [markRead]);

  const oldestId = messages.find((m) => !m.status)?.id;

  const loadOlder = useCallback(async () => {
    if (olderBusy.current || !hasMore || !oldestId) return;
    olderBusy.current = true;
    setLoadingOlder(true);
    try {
      const page = await listMessages(conversationId, oldestId);
      const el = scroller.current;
      if (el) scrollOp.current = { type: 'keep', height: el.scrollHeight, top: el.scrollTop };
      setMessages((prev) => mergeMessages(prev, [...page.items].reverse()));
      setHasMore(page.hasMore);
    } catch (e) {
      toast.error(errorMessage(e, 'Không tải được tin cũ hơn'));
    } finally {
      olderBusy.current = false;
      setLoadingOlder(false);
    }
  }, [conversationId, hasMore, oldestId]);

  // Áp thao tác cuộn sau khi DOM đã cập nhật (trước khi vẽ → không nháy).
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const op = scrollOp.current;
    scrollOp.current = null;
    if (op?.type === 'bottom') el.scrollTop = el.scrollHeight;
    else if (op?.type === 'keep') el.scrollTop = el.scrollHeight - op.height + op.top;
    else if (hasMore && el.scrollHeight <= el.clientHeight) void loadOlder(); // nội dung chưa đầy khung → nạp thêm
  }, [messages, status, hasMore, loadOlder]);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_GAP;
    if (atBottom.current) setShowNew(false);
    if (el.scrollTop < 120) void loadOlder();
  }

  // Chỉ đụng tới cuộn / "Tin mới" khi tin thật sự được thêm (echo socket của tin đã có thì bỏ qua).
  const appendIncoming = useCallback(
    (m: LocalMessage, fromMe: boolean) => {
      if (messages.some((p) => p.id === m.id)) return;
      setMessages((prev) => mergeMessages(prev, [m]));
      if (fromMe || atBottom.current) scrollOp.current = { type: 'bottom' };
      else setShowNew(true);
    },
    [messages],
  );

  // Sự kiện socket.
  useEffect(() => {
    if (!lastEvent || lastEvent === seenEvent.current) return;
    seenEvent.current = lastEvent;
    if (lastEvent.type === 'reconnect') {
      void reloadDetail();
      listMessages(conversationId)
        .then((page) => {
          setMessages((prev) => mergeMessages(prev, [...page.items].reverse()));
          markRead();
        })
        .catch(() => {});
    } else if (lastEvent.conversationId !== conversationId) {
      return;
    } else if (lastEvent.type === 'message:new') {
      const fromMe = lastEvent.message.senderId === me;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ state từ socket (hệ thống ngoài)
      appendIncoming(lastEvent.message, fromMe);
      if (!fromMe) markRead();
    } else if (lastEvent.type === 'conversation:read') {
      const { userId, readAt } = lastEvent;
      if (userId !== me) setDetail((d) => (d ? { ...d, otherLastReadAt: readAt } : d));
    } else {
      void reloadDetail();
    }
  }, [lastEvent, conversationId, me, appendIncoming, markRead, reloadDetail]);

  // Link ảnh ký hết hạn sau 1 giờ: lỗi tải ảnh thì lấy lại trang tin mới nhất (tối đa 1 lần / 30 giây).
  const lastRefresh = useRef(0);
  const refreshImages = useCallback(() => {
    if (Date.now() - lastRefresh.current < 30_000) return;
    lastRefresh.current = Date.now();
    listMessages(conversationId)
      .then((page) => setMessages((prev) => mergeMessages(prev, [...page.items].reverse())))
      .catch(() => {});
  }, [conversationId]);

  // Preview blob của tin tạm: thu hồi khi tin thật thay thế hoặc người dùng xoá tin lỗi.
  const previews = useRef(new Map<string, string[]>());
  const revoke = (tmpId: string) => {
    previews.current.get(tmpId)?.forEach((u) => URL.revokeObjectURL(u));
    previews.current.delete(tmpId);
  };
  useEffect(() => {
    const map = previews.current;
    return () => map.forEach((urls) => urls.forEach((u) => URL.revokeObjectURL(u)));
  }, []);

  async function deliver(tmpId: string, body: string, keys: string[]) {
    try {
      const dto = await sendMessage(conversationId, { body, imageKeys: keys });
      revoke(tmpId);
      // Socket có thể đã đưa tin thật về trước → chỉ cần bỏ tin tạm.
      setMessages((prev) => (prev.some((p) => p.id === dto.id) ? prev.filter((p) => p.id !== tmpId) : prev.map((p) => (p.id === tmpId ? dto : p))));
    } catch (e) {
      setMessages((prev) => prev.map((p) => (p.id === tmpId ? { ...p, status: 'failed' } : p)));
      const code = axios.isAxiosError(e) ? (e.response?.data as { code?: string } | undefined)?.code : undefined;
      if (axios.isAxiosError(e) && e.response?.status === 403 && code) void reloadDetail();
      else if (axios.isAxiosError(e) && e.response?.status === 429) toast.error(errorMessage(e, 'Bạn gửi quá nhanh, thử lại sau ít phút'));
    }
  }

  function send(body: string, images: SendImage[]) {
    const tmpId = `tmp-${Date.now()}-${tmpSeq.current++}`;
    scrollOp.current = { type: 'bottom' };
    setMessages((prev) => [
      ...prev,
      { id: tmpId, conversationId, senderId: me, body, images: images.map((i) => ({ key: i.key, url: i.preview })), createdAt: new Date().toISOString(), status: 'sending' },
    ]);
    if (images.length) previews.current.set(tmpId, images.map((i) => i.preview));
    void deliver(tmpId, body, images.map((i) => i.key));
  }

  function retry(id: string) {
    const m = messages.find((p) => p.id === id);
    if (!m) return;
    setMessages((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'sending' } : p)));
    void deliver(id, m.body, m.images.map((i) => i.key));
  }

  async function toggleBlock(action: 'block' | 'unblock') {
    setBusy(true);
    try {
      await (action === 'block' ? blockConversation(conversationId) : unblockConversation(conversationId));
      await reloadDetail();
      toast.success(action === 'block' ? 'Đã chặn' : 'Đã bỏ chặn');
    } catch (e) {
      toast.error(errorMessage(e, 'Thao tác không thành công'));
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  const groups = groupMessages(messages, me);

  // "Đã xem": dưới tin cuối cùng của mình (đã gửi xong) nếu người kia đọc sau tin đó.
  const seenId = (() => {
    const last = [...messages].reverse().find((m) => m.senderId === me);
    if (!last || last.status || !detail?.otherLastReadAt) return null;
    return new Date(detail.otherLastReadAt) >= new Date(last.createdAt) ? last.id : null;
  })();

  if (status === 'loading' || !ready) return <ThreadSkeleton />;
  if (status === 'notfound' || status === 'error' || !detail) {
    const nf = status === 'notfound';
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-semibold">{nf ? 'Không tìm thấy cuộc trò chuyện' : 'Không tải được cuộc trò chuyện'}</p>
        <p className="text-sm text-muted-foreground">{nf ? 'Cuộc trò chuyện không tồn tại hoặc bạn không thuộc cuộc này.' : 'Kiểm tra kết nối rồi thử lại.'}</p>
        {nf ? (
          <Link href={basePath} className={buttonVariants({ variant: 'outline' })}>
            Về danh sách tin nhắn
          </Link>
        ) : (
          <Button variant="outline" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  const { other } = detail;
  const blockedByMe = detail.blocked === 'me';

  return (
    <div className="flex h-full min-h-0 flex-1">
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b bg-card px-3 py-2.5 sm:px-4">
        <Link href={basePath} aria-label="Quay lại danh sách" className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'md:hidden' })}>
          <ArrowLeft />
        </Link>
        <UserAvatar user={other} size="lg" />
        <div className="min-w-0 flex-1">
          <Link href={`/u/${other.id}`} className="block truncate text-sm font-bold hover:text-primary hover:underline">
            {other.name}
          </Link>
          {detail.courses.length > 0 && (
            <ul className="mt-1 flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Khoá học chung">
              {detail.courses.map((c) => (
                <li key={c.id} className="shrink-0">
                  <Link href={`/course/${c.slug}`} className={cn(badgeVariants({ variant: 'secondary' }), 'max-w-56 truncate hover:bg-secondary/70')}>
                    <span className="truncate">{c.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        {contextSlot?.(detail)}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Tuỳ chọn cuộc trò chuyện" />}>
            <Ellipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setConfirm(blockedByMe ? 'unblock' : 'block')}>{blockedByMe ? 'Bỏ chặn' : 'Chặn'}</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="relative min-h-0 flex-1 bg-muted/40">
        <div
          ref={scroller}
          onScroll={onScroll}
          role="log"
          aria-label="Tin nhắn"
          tabIndex={0}
          {...pointer}
          className="h-full overflow-y-auto overscroll-contain px-3 py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:px-5"
        >
          {loadingOlder && <p className="pb-3 text-center text-xs text-muted-foreground">Đang tải tin cũ hơn…</p>}
          {!hasMore && (
            <p className="mx-auto mb-4 flex max-w-md items-start gap-2 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {NOTICE}
            </p>
          )}
          <div className="flex flex-col gap-4">
            {groups.map((g) => (
              <section key={g.day} className="flex flex-col gap-3" aria-label={g.dayLabel}>
                <div className="flex justify-center">
                  <Badge variant="outline" className="bg-card text-muted-foreground">
                    {g.dayLabel}
                  </Badge>
                </div>
                {g.runs.map((run) => (
                  <div key={run.messages[0].id} className="flex flex-col gap-0.5">
                    {run.messages.map((m, i) => (
                      <div key={m.id} className="flex flex-col gap-0.5">
                        <MessageBubble
                          message={m}
                          mine={run.mine}
                          other={other}
                          showAvatar={i === run.messages.length - 1}
                          isLastInRun={i === run.messages.length - 1}
                          onRetry={retry}
                          onRemove={(id) => {
                            revoke(id);
                            setMessages((prev) => prev.filter((p) => p.id !== id));
                          }}
                          onImageError={refreshImages}
                        />
                        {m.id === seenId && <p className="pr-1 text-right text-xs text-muted-foreground">Đã xem</p>}
                      </div>
                    ))}
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
        {showNew && (
          <Button
            size="sm"
            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-md"
            onClick={() => {
              const el = scroller.current;
              if (el) el.scrollTo({ top: el.scrollHeight });
              setShowNew(false);
            }}
          >
            Tin mới
            <ArrowDown data-icon="inline-end" />
          </Button>
        )}
      </div>

      {detail.canSend ? (
        <Composer conversationId={conversationId} onSend={send} />
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t bg-card px-4 py-4 text-center text-sm text-muted-foreground">
          {detail.reason === 'BLOCKED_BY_ME' ? (
            <>
              <span>Bạn đã chặn {other.name}.</span>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => void toggleBlock('unblock')}>
                Bỏ chặn
              </Button>
            </>
          ) : (
            <span>{CANNOT_SEND_TEXT[detail.reason === 'NO_PAID_LINK' ? 'NO_PAID_LINK' : 'BLOCKED_BY_OTHER']}</span>
          )}
        </div>
      )}

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === 'unblock' ? `Bỏ chặn ${other.name}?` : `Chặn ${other.name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'unblock'
                ? 'Hai bạn sẽ nhắn tin lại được nếu vẫn còn khoá trả phí chung.'
                : `${other.name} sẽ không gửi được tin cho bạn nữa. Bạn có thể bỏ chặn bất cứ lúc nào.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              variant={confirm === 'block' ? 'destructive' : 'default'}
              disabled={busy}
              onClick={() => confirm && void toggleBlock(confirm)}
            >
              {confirm === 'unblock' ? 'Bỏ chặn' : 'Chặn'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    {asideSlot && (
      <aside aria-label="Thông tin" className="hidden w-80 shrink-0 overflow-y-auto border-l bg-card xl:block">
        {asideSlot(detail)}
      </aside>
    )}
    </div>
  );
}
