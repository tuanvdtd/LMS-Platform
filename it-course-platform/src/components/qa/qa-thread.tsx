// src/components/qa/qa-thread.tsx — UI Hỏi đáp kiểu bình luận (khôi phục lesson-qa.tsx của sếp, commit 2c9f750).
'use client';

import { useState } from 'react';
import { CircleAlert, CornerDownRight, Ellipsis, LoaderCircle, Reply, RotateCcw } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { MarkdownInput } from '@/components/markdown-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { QA_BODY_MAX, type Answer, type QaAuthor, type Question } from '@/types/qa';

export type QaStatus = 'sent' | 'sending' | 'failed';
// key: id tạm lúc gửi lạc quan, giữ nguyên sau khi server trả id thật → React không remount luồng đang mở.
export type LocalAnswer = Answer & { key: string; status: QaStatus; replyToAnswerId?: string };
export type LocalQuestion = Omit<Question, 'answers'> & { key: string; status: QaStatus; answers: LocalAnswer[] };
type Comment = { id: string; body: string; createdAt: string; author: QaAuthor; status: QaStatus; canDelete: boolean };

const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536e3], ['month', 2592e3], ['day', 86400], ['hour', 3600], ['minute', 60]];
function timeAgo(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'Vừa xong';
}
const fullTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w.match(/\p{L}/u)?.[0] ?? '')
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase();

export function UserAvatar({ author, className }: { author: Pick<QaAuthor, 'name' | 'image'>; className?: string }) {
  return (
    <Avatar className={cn('mt-0.5', className)}>
      {author.image && <AvatarImage src={author.image} alt="" />}
      <AvatarFallback className="text-xs font-semibold text-slate-600">{initials(author.name)}</AvatarFallback>
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

function CommentItem({
  comment,
  isInstructor,
  replyTo,
  onReply,
  onRetry,
  onDelete,
}: {
  comment: Comment;
  isInstructor?: boolean;
  replyTo?: string | null;
  onReply: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const { author, status } = comment;
  const sending = status === 'sending';
  const failed = status === 'failed';

  return (
    <article className="flex gap-3 py-2.5">
      <UserAvatar author={author} className={cn(sending && 'opacity-50')} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={cn('text-sm font-medium', sending ? 'text-muted-foreground' : 'text-foreground')}>{author.name}</span>
            {isInstructor && (
              <span className="inline-flex h-5 items-center rounded-md bg-primary/10 px-1.5 text-xs font-medium text-primary">Giảng viên</span>
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

        {replyTo && (
          <p className="text-xs text-muted-foreground">
            Trả lời <b className="font-medium text-foreground">{replyTo}</b>
          </p>
        )}
        <Markdown userContent className={cn('mt-0.5 wrap-break-word', sending ? 'text-muted-foreground' : 'text-foreground')}>
          {comment.body}
        </Markdown>

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
  onAnswer: (question: LocalQuestion, content: string, target: LocalAnswer | null) => void;
  onRetry: (question: LocalQuestion, answer?: LocalAnswer) => void;
  onDelete: (question: LocalQuestion, answer?: LocalAnswer) => void;
}

// Kiểu phẳng 2 tầng: gốc + một tầng trả lời. Trả lời một trả lời khác đứng cùng tầng, ghi "Trả lời <tên>".
const VISIBLE_REPLIES = 2;

export function Thread({ root, me, handlers }: { root: LocalQuestion; me: QaAuthor; handlers: ThreadHandlers }) {
  const [expanded, setExpanded] = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const replies = root.answers;
  const shown = expanded ? replies : replies.slice(0, VISIBLE_REPLIES);
  const hidden = replies.length - shown.length;

  const composerFor = (targetId: string, name: string, target: LocalAnswer | null) => replyingId === targetId && (
    <div className="py-2">
      <Composer
        me={me}
        isReply
        placeholder={`Trả lời ${name}…`}
        submitLabel="Trả lời"
        onCancel={() => setReplyingId(null)}
        onSubmit={(content) => {
          handlers.onAnswer(root, content, target);
          setReplyingId(null);
          setExpanded(true); // trả lời mới nằm cuối danh sách — mở hết để người gửi thấy
        }}
      />
    </div>
  );

  return (
    <div className="py-1">
      <CommentItem
        comment={root}
        onReply={() => setReplyingId(root.id)}
        onRetry={() => handlers.onRetry(root)}
        onDelete={() => handlers.onDelete(root)}
      />
      {(replies.length > 0 || replyingId) && (
        <div className="ml-11">
          {composerFor(root.id, root.author.name, null)}
          {shown.map((a) => (
            <div key={a.key}>
              <CommentItem
                comment={a}
                isInstructor={a.isInstructor}
                replyTo={a.replyTo?.name}
                onReply={() => setReplyingId(a.id)}
                onRetry={() => handlers.onRetry(root, a)}
                onDelete={() => handlers.onDelete(root, a)}
              />
              {composerFor(a.id, a.author.name, a)}
            </div>
          ))}
          {hidden > 0 && (
            <Button variant="ghost" size="xs" className="-ml-2 my-1 text-muted-foreground" onClick={() => setExpanded(true)}>
              <CornerDownRight />Xem thêm {hidden} trả lời
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
