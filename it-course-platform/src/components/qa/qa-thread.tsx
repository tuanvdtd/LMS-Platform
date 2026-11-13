// src/components/qa/qa-thread.tsx — UI Hỏi đáp kiểu bình luận (khôi phục lesson-qa.tsx của sếp, commit 2c9f750).
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
  onCancel,
  onSubmit,
}: {
  me: QaAuthor;
  placeholder: string;
  submitLabel: string;
  isReply?: boolean;
  onCancel?: () => void;
  onSubmit: (content: string) => void;
}) {
  const [value, setValue] = useState('');
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
          autoFocus={isReply}
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          <span className="mr-auto text-xs text-muted-foreground tabular-nums">
            {value.length}/{QA_BODY_MAX}
          </span>
          {onCancel && <Button variant="secondary" size="sm" className="text-sm" onClick={onCancel}>Huỷ</Button>}
          <Button
            size="sm"
            className="text-sm"
            disabled={!value.trim()}
            onClick={() => { onSubmit(value.trim()); setValue(''); }}
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

const ROLE_BADGE = {
  instructor: { label: 'Giảng viên', className: 'bg-primary/10 text-primary' },
  asker: { label: 'Người hỏi', className: 'bg-muted text-muted-foreground' },
} as const;

function CommentItem({
  comment,
  domKey,
  role,
  replyTo,
  onJump,
  onReply,
  onRetry,
  onDelete,
}: {
  comment: Comment;
  domKey: string;
  role?: keyof typeof ROLE_BADGE | null;
  replyTo?: Answer['replyTo'];
  onJump?: () => void;
  onReply: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const { author, status } = comment;
  const sending = status === 'sending';
  const failed = status === 'failed';

  return (
    // -mx-2 px-2: chừa lề cho nền nháy sáng khi được cuộn tới.
    <article id={DOM_ID(domKey)} className="-mx-2 flex scroll-mt-24 gap-3 rounded-lg px-2 py-2.5">
      <UserAvatar author={author} className={cn(sending && 'opacity-50')} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={cn('text-sm font-medium', sending ? 'text-muted-foreground' : 'text-foreground')}>{author.name}</span>
            {role && (
              <span className={cn('inline-flex h-5 items-center rounded-md px-1.5 text-xs font-medium', ROLE_BADGE[role].className)}>
                {ROLE_BADGE[role].label}
              </span>
            )}
            {sending ? (
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
            )}
          </div>
          {status === 'sent' && comment.canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="-my-1 text-muted-foreground" aria-label="Thao tác" />}>
                <Ellipsis />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem className="focus:text-destructive" onClick={onDelete}>Xoá bình luận</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className={cn('mt-0.5 text-sm leading-relaxed wrap-break-word', sending ? 'text-muted-foreground' : 'text-foreground')}>
          {replyTo && <Mention name={replyTo.name} onJump={onJump} />}
          {/* Đoạn đầu inline để "@Tên" nằm chung dòng với chữ; đoạn đầu là code/danh sách thì xuống dòng như thường. */}
          <Markdown userContent className={cn(replyTo && 'inline [&>p:first-child]:inline')}>
            {comment.body}
          </Markdown>
        </div>

        {failed ? (
          <div className="mt-1.5 flex gap-2">
            <Button variant="outline" size="xs" onClick={onRetry}><RotateCcw />Thử lại</Button>
            <Button variant="destructive" size="xs" onClick={onDelete}>Xoá</Button>
          </div>
        ) : (
          <Button variant="ghost" size="xs" className="-ml-2 mt-0.5 text-muted-foreground" disabled={sending} onClick={onReply}>
            <Reply />Trả lời
          </Button>
        )}
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
}: {
  root: LocalQuestion;
  me: QaAuthor;
  handlers: ThreadHandlers;
  focus?: { answerId?: string };
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
    <div className="py-1">
      <CommentItem
        comment={root}
        domKey={root.key}
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
                  role={a.isInstructor ? 'instructor' : a.author.id === root.author.id ? 'asker' : null}
                  replyTo={a.replyTo}
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
