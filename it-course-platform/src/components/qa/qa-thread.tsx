// src/components/qa/qa-thread.tsx — UI Hỏi đáp kiểu bình luận.
'use client';

import { useEffect, useState } from 'react';
import { ChevronUp, CircleAlert, Ellipsis, LoaderCircle, Reply, RotateCcw } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { MarkdownInput } from '@/components/markdown-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fullTime, timeAgo } from '@/lib/time-ago';
import { cn } from '@/lib/utils';
import { QA_BODY_MAX, type Answer, type QaAuthor, type Question } from '@/types/qa';

export type QaStatus = 'sent' | 'sending' | 'failed';
// key: id tạm lúc gửi lạc quan, giữ nguyên sau khi server trả id thật → React không remount luồng đang mở.
export type LocalAnswer = Answer & { key: string; status: QaStatus; replyToAnswerId?: string };
export type LocalQuestion = Omit<Question, 'answers'> & { key: string; status: QaStatus; answers: LocalAnswer[] };
type Comment = { id: string; body: string; createdAt: string; author: QaAuthor; status: QaStatus; canDelete: boolean };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w.match(/\p{L}/u)?.[0] ?? '')
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase();

const DOM_ID = (key: string) => `qa-${key}`;

// Cuộn tới bình luận rồi nháy nền một lần để mắt bắt được nó giữa cả chuỗi trả lời.
export function flashComment(key: string) {
  const el = document.getElementById(DOM_ID(key));
  if (!el) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  const tint = getComputedStyle(el).getPropertyValue('--primary-light').trim();
  el.animate([{ backgroundColor: tint }, { backgroundColor: tint, offset: 0.35 }, { backgroundColor: 'transparent' }], {
    duration: 1800,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  });
}

export function UserAvatar({ author, className }: { author: Pick<QaAuthor, 'name' | 'image'>; className?: string }) {
  return (
    <Avatar className={cn('mt-0.5', className)}>
      {author.image && <AvatarImage src={author.image} alt="" />}
      <AvatarFallback className="text-xs font-semibold text-muted-foreground">{initials(author.name)}</AvatarFallback>
    </Avatar>
  );
}

export function Composer({
  me,
  placeholder,
  submitLabel,
  isReply = false,
  collapsible = false,
  onCancel,
  onSubmit,
}: {
  me: QaAuthor;
  placeholder: string;
  submitLabel: string;
  isReply?: boolean;
  collapsible?: boolean; // thu thành một dòng, bấm mới mở trình soạn: đỡ chiếm chỗ khi chỉ đọc
  onCancel?: () => void;
  onSubmit: (content: string) => void;
}) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(!collapsible);
  const close = collapsible ? () => { setValue(''); setOpen(false); } : onCancel;

  if (!open)
    return (
      <div className="flex gap-3">
        <UserAvatar author={me} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 min-w-0 flex-1 items-center rounded-full border border-input px-4 text-left text-sm text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="truncate">{placeholder}</span>
        </button>
      </div>
    );

  return (
    <div className="flex gap-3">
      {/* Màn hẹp: ô trả lời bỏ avatar để lấy lại bề ngang */}
      <UserAvatar author={me} className={cn(isReply && 'hidden sm:flex')} />
      <div className="min-w-0 flex-1">
        <MarkdownInput
          value={value}
          onChange={setValue}
          height={isReply ? 120 : 150}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={QA_BODY_MAX}
          autoFocus={isReply || collapsible}
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          <span className="mr-auto text-xs text-muted-foreground tabular-nums">
            {value.length}/{QA_BODY_MAX}
          </span>
          {close && <Button variant="secondary" size="sm" className="text-sm" onClick={close}>Huỷ</Button>}
          <Button
            size="sm"
            className="text-sm"
            disabled={!value.trim()}
            onClick={() => { onSubmit(value.trim()); setValue(''); if (collapsible) setOpen(false); }}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// "@Tên" đầu nội dung như bình luận mạng xã hội. Biết bình luận được trả lời thì bấm để cuộn tới đó;
// bình luận đó đã xoá hoặc dữ liệu cũ chỉ lưu người → chữ thường, không bấm.
function Mention({ name, onJump }: { name: string; onJump?: () => void }) {
  const cls = 'mr-1 font-medium text-primary';
  if (!onJump) return <span className={cls}>@{name}</span>;
  return (
    <button
      type="button"
      onClick={onJump}
      title={`Xem bình luận của ${name}`}
      className={cn(cls, 'cursor-pointer rounded-sm underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50')}
    >
      @{name}
    </button>
  );
}

export type RoleBadge = { label: string; tone: 'primary' | 'muted' };
// Nhãn cạnh tên người viết. Hỏi đáp và bình luận bài viết gắn nhãn theo quy tắc riêng.
export type RoleOf = (comment: LocalQuestion | LocalAnswer, root: LocalQuestion) => RoleBadge | null;

const TONE = { primary: 'bg-primary/10 text-primary', muted: 'bg-muted text-muted-foreground' } as const;

// Hỏi đáp: gốc không gắn nhãn; trả lời của giảng viên / người hỏi có nhãn.
export const qaRoleOf: RoleOf = (c, root) => {
  if (c === root || !('isInstructor' in c)) return null;
  if (c.isInstructor) return { label: 'Giảng viên', tone: 'primary' };
  return c.author.id === root.author.id ? { label: 'Người hỏi', tone: 'muted' } : null;
};

function CommentItem({
  comment,
  domKey,
  role,
  replyTo,
  canReply = true,
  bubble = false,
  onJump,
  onReply,
  onRetry,
  onDelete,
}: {
  comment: Comment;
  domKey: string;
  role?: RoleBadge | null;
  replyTo?: Answer['replyTo'];
  canReply?: boolean;
  bubble?: boolean;
  onJump?: () => void;
  onReply: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const { author, status } = comment;
  const sending = status === 'sending';
  const failed = status === 'failed';
  const ink = sending ? 'text-muted-foreground' : 'text-foreground';

  // Tab mới: bấm vào tên giữa bài học không làm mất chỗ đang xem. Không id (tài khoản quản trị) → không có trang cá nhân.
  const name = author.id ? (
    <a
      href={`/u/${author.id}`}
      target="_blank"
      rel="noopener"
      className={cn('rounded-sm text-sm font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50', ink)}
    >
      {author.name}
    </a>
  ) : (
    <span className={cn('text-sm font-medium', ink)}>{author.name}</span>
  );
  const badge = role && (
    <span className={cn('inline-flex h-5 items-center rounded-md px-1.5 text-xs font-medium', TONE[role.tone])}>{role.label}</span>
  );
  const state = sending ? (
    <span role="status" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" />Đang gửi…
    </span>
  ) : failed ? (
    <span role="status" className="inline-flex items-center gap-1 text-xs text-destructive">
      <CircleAlert className="size-3.5" />Gửi không thành công
    </span>
  ) : (
    <time dateTime={comment.createdAt} title={fullTime(comment.createdAt)} className="text-xs text-muted-foreground" suppressHydrationWarning>
      {timeAgo(comment.createdAt)}
    </time>
  );
  const menu = status === 'sent' && comment.canDelete && (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Thao tác"
            className={cn(
              '-my-1 shrink-0 text-muted-foreground',
              // Bong bóng dài ngắn khác nhau → ba chấm so le. Máy có chuột: chỉ hiện khi rê / Tab vào bình luận hoặc đang mở menu.
              // Màn cảm ứng không rê được → luôn hiện.
              bubble &&
                'pointer-fine:opacity-0 pointer-fine:group-hover/comment:opacity-100 pointer-fine:group-focus-within/comment:opacity-100 pointer-fine:data-popup-open:opacity-100',
            )}
          />
        }
      >
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem className="focus:text-destructive" onClick={onDelete}>Xoá bình luận</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const body = (
    // Trong bong bóng (nền muted), code của Markdown cũng nền muted → đổi biến để code nổi trên bong bóng.
    <div className={cn('text-sm leading-relaxed wrap-break-word', ink, bubble ? '[--muted:var(--background)]' : 'mt-0.5')}>
      {replyTo && <Mention name={replyTo.name} onJump={onJump} />}
      {/* Đoạn đầu inline để "@Tên" nằm chung dòng với chữ; đoạn đầu là code/danh sách thì xuống dòng như thường. */}
      <Markdown userContent className={cn(replyTo && 'inline [&>p:first-child]:inline')}>
        {comment.body}
      </Markdown>
    </div>
  );
  const retry = failed && (
    <div className="mt-1.5 flex gap-2">
      <Button variant="outline" size="xs" onClick={onRetry}><RotateCcw />Thử lại</Button>
      <Button variant="destructive" size="xs" onClick={onDelete}>Xoá</Button>
    </div>
  );

  // Bong bóng: tên + nội dung trong một khối nền nhạt, giờ + "Trả lời" nhỏ bên dưới.
  // Tách bình luận bằng khối nền thay đường kẻ → danh sách nhiều bình luận ngắn không thành bảng dày đặc.
  if (bubble)
    return (
      <article id={DOM_ID(domKey)} className="group/comment -mx-2 flex scroll-mt-24 gap-3 rounded-lg px-2 py-1">
        <UserAvatar author={author} className={cn(sending && 'opacity-50')} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <div className="min-w-0 rounded-2xl bg-muted px-3.5 py-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">{name}{badge}</div>
              {body}
            </div>
            {menu}
          </div>
          <div className="mt-1 flex items-center gap-3 px-3.5">
            {state}
            {!failed && canReply && (
              <button
                type="button"
                disabled={sending}
                onClick={onReply}
                className="rounded-sm text-xs font-medium text-muted-foreground outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
              >
                Trả lời
              </button>
            )}
          </div>
          {retry}
        </div>
      </article>
    );

  return (
    // -mx-2 px-2: chừa lề cho nền nháy sáng khi được cuộn tới.
    <article id={DOM_ID(domKey)} className="-mx-2 flex scroll-mt-24 gap-3 rounded-lg px-2 py-2.5">
      <UserAvatar author={author} className={cn(sending && 'opacity-50')} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">{name}{badge}{state}</div>
          {menu}
        </div>
        {body}
        {retry ||
          (canReply && (
            <Button variant="ghost" size="xs" className="-ml-2 mt-0.5 text-muted-foreground" disabled={sending} onClick={onReply}>
              <Reply />Trả lời
            </Button>
          ))}
      </div>
    </article>
  );
}

export interface ThreadHandlers {
  onAnswer: (question: LocalQuestion, content: string, target: LocalAnswer | null) => string; // trả key trả lời mới
  onRetry: (question: LocalQuestion, answer?: LocalAnswer) => void;
  onDelete: (question: LocalQuestion, answer?: LocalAnswer) => void;
}

// Kiểu phẳng 2 tầng: gốc + một tầng trả lời. Trả lời một trả lời khác đứng cùng tầng, mở đầu bằng "@Tên".
// Thu gọn thì giữ 2 trả lời mới nhất — đoạn trao đổi đang diễn ra luôn thấy được.
const VISIBLE_REPLIES = 2;

export function Thread({
  root,
  me,
  handlers,
  focus,
  roleOf = qaRoleOf,
  canReply = true,
  bubble = false,
}: {
  root: LocalQuestion;
  me: QaAuthor;
  handlers: ThreadHandlers;
  focus?: { answerId?: string };
  roleOf?: RoleOf;
  canReply?: boolean; // chưa đăng nhập → chỉ đọc
  bubble?: boolean;
}) {
  // Mở từ thông báo: board remount thread này (đổi key) → mở rộng sẵn rồi cuộn tới câu trả lời / câu hỏi.
  const [expanded, setExpanded] = useState(() => !!focus);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const replies = root.answers;
  const hidden = expanded ? 0 : Math.max(0, replies.length - VISIBLE_REPLIES);
  const shown = replies.slice(hidden);

  // Bình luận đích có thể đang bị thu gọn → mở hết rồi mới cuộn (đợi 1 frame cho DOM có phần tử).
  const jumpTo = (key: string) => {
    setExpanded(true);
    requestAnimationFrame(() => flashComment(key));
  };
  // Server trả answerId thật; bình luận gửi lạc quan có key là id tạm → tra key qua id.
  const keyOf = (answerId: string | null | undefined) => replies.find((a) => a.id === answerId)?.key;

  useEffect(() => {
    if (!focus) return;
    const key = keyOf(focus.answerId) ?? root.key;
    requestAnimationFrame(() => flashComment(key));
    // Chỉ chạy lúc mount: mỗi lần mở từ thông báo board đổi key của thread.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const composerFor = (targetId: string, name: string, target: LocalAnswer | null) => replyingId === targetId && (
    <div className="py-2">
      <Composer
        me={me}
        isReply
        placeholder={`Trả lời ${name}…`}
        submitLabel="Trả lời"
        onCancel={() => setReplyingId(null)}
        onSubmit={(content) => {
          const key = handlers.onAnswer(root, content, target);
          setReplyingId(null);
          jumpTo(key); // trả lời mới nằm cuối chuỗi, xa ô vừa soạn → đưa người gửi tới đó
        }}
      />
    </div>
  );

  return (
    <div className={cn(!bubble && 'py-1')}>
      <CommentItem
        comment={root}
        domKey={root.key}
        role={roleOf(root, root)}
        canReply={canReply}
        bubble={bubble}
        onReply={() => setReplyingId(root.id)}
        onRetry={() => handlers.onRetry(root)}
        onDelete={() => handlers.onDelete(root)}
      />
      {(replies.length > 0 || replyingId) && (
        <div className="ml-11">
          {composerFor(root.id, root.author.name, null)}
          {hidden > 0 && (
            <Button variant="ghost" size="xs" className="-ml-2 my-1 text-muted-foreground" onClick={() => setExpanded(true)}>
              <ChevronUp />Xem {hidden} trả lời trước
            </Button>
          )}
          {shown.map((a) => {
            const targetKey = keyOf(a.replyTo?.answerId);
            return (
              <div key={a.key}>
                <CommentItem
                  comment={a}
                  domKey={a.key}
                  role={roleOf(a, root)}
                  replyTo={a.replyTo}
                  canReply={canReply}
                  bubble={bubble}
                  onJump={targetKey ? () => jumpTo(targetKey) : undefined}
                  onReply={() => setReplyingId(a.id)}
                  onRetry={() => handlers.onRetry(root, a)}
                  onDelete={() => handlers.onDelete(root, a)}
                />
                {composerFor(a.id, a.author.name, a)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
