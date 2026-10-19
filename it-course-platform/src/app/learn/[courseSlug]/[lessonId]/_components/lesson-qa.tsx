'use client';

import { useState } from 'react';
import { CircleAlert, CornerDownRight, Ellipsis, LoaderCircle, Reply, RotateCcw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { MOCK_LESSON_QA, type QaComment } from '@/lib/mock-lesson-qa';

const ME = { name: 'Hoàng Anh', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' };

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
const initials = (name: string) => name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase();
const countSent = (list: QaComment[]): number =>
  list.reduce((n, c) => n + (c.status === 'sent' ? 1 : 0) + countSent(c.replies), 0);

function UserAvatar({ name, src, className }: { name: string; src: string | null; className?: string }) {
  return (
    <Avatar className={cn('mt-0.5', className)}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback className="text-xs font-semibold text-slate-600">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

function Composer({
  placeholder,
  submitLabel,
  isReply = false,
  onCancel,
  onSubmit,
}: {
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
      <UserAvatar name={ME.name} src={ME.avatar} className={cn(isReply && 'hidden sm:flex')} />
      <div className="min-w-0 flex-1">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus={isReply}
          className={cn('bg-card', isReply ? 'min-h-14' : 'min-h-20')}
        />
        <div className="mt-2 flex justify-end gap-2">
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

interface Handlers {
  onSubmit: (content: string, parentId: string | null) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
}

// Kiểu phẳng 2 tầng: gốc + một tầng trả lời. Trả lời sâu hơn đứng cùng tầng, ghi "Trả lời <tên>".
const VISIBLE_REPLIES = 2;

// Trả lời thẳng câu hỏi gốc thì không cần dòng "Trả lời <tên>" (so theo id, không theo tên:
// người hỏi có thể được trả lời lại ở tầng sâu).
function flatten(comment: QaComment, rootId = comment.id): { comment: QaComment; replyTo: string | null }[] {
  return comment.replies.flatMap((r) => [
    { comment: r, replyTo: comment.id === rootId ? null : comment.author.name },
    ...flatten(r, rootId),
  ]);
}

function CommentItem({ comment, replyTo, handlers, onReply }: {
  comment: QaComment;
  replyTo: string | null;
  handlers: Handlers;
  onReply: () => void;
}) {
  const { author, status } = comment;
  const sending = status === 'sending';
  const failed = status === 'failed';

  return (
    <article className="flex gap-3 py-2.5">
      <UserAvatar name={author.name} src={author.avatar} className={cn(sending && 'opacity-50')} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={cn('text-sm font-medium', sending ? 'text-muted-foreground' : 'text-foreground')}>{author.name}</span>
            {author.isInstructor && (
              <span className="inline-flex h-5 items-center rounded-md bg-primary/10 px-1.5 text-xs font-medium text-primary">Giảng viên</span>
            )}
            {sending ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />Đang gửi…
              </span>
            ) : failed ? (
              <span className="inline-flex items-center gap-1 text-xs text-red-600">
                <CircleAlert className="size-3.5" />Gửi không thành công
              </span>
            ) : (
              <time dateTime={comment.createdAt} title={fullTime(comment.createdAt)} className="text-xs text-muted-foreground" suppressHydrationWarning>
                {timeAgo(comment.createdAt)}
              </time>
            )}
          </div>
          {status === 'sent' && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="-my-1 text-muted-foreground" aria-label="Thao tác" />}>
                <Ellipsis />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {author.isMe ? (
                  <DropdownMenuItem className="focus:text-destructive" onClick={() => handlers.onDelete(comment.id)}>Xoá bình luận</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handlers.onReport(comment.id)}>Báo cáo vi phạm</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {replyTo && (
          <p className="text-xs text-muted-foreground">
            Trả lời <b className="font-medium text-foreground">{replyTo}</b>
          </p>
        )}
        <p className={cn('mt-0.5 whitespace-pre-line text-sm wrap-break-word', sending ? 'text-muted-foreground' : 'text-foreground')}>
          {comment.content}
        </p>

        {failed ? (
          <div className="mt-1.5 flex gap-2">
            <Button variant="outline" size="xs" onClick={() => handlers.onRetry(comment.id)}><RotateCcw />Thử lại</Button>
            <Button variant="destructive" size="xs" onClick={() => handlers.onDelete(comment.id)}>Xoá</Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="xs"
            className="-ml-2 mt-0.5 text-muted-foreground"
            disabled={sending}
            onClick={onReply}
          >
            <Reply />Trả lời
          </Button>
        )}
      </div>
    </article>
  );
}

function Thread({ root, handlers }: { root: QaComment; handlers: Handlers }) {
  const [expanded, setExpanded] = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const replies = flatten(root);
  const shown = expanded ? replies : replies.slice(0, VISIBLE_REPLIES);
  const hidden = replies.length - shown.length;

  const composerFor = (target: QaComment) => replyingId === target.id && (
    <div className="py-2">
      <Composer
        isReply
        placeholder={`Trả lời ${target.author.name}…`}
        submitLabel="Trả lời"
        onCancel={() => setReplyingId(null)}
        onSubmit={(content) => { handlers.onSubmit(content, target.id); setReplyingId(null); }}
      />
    </div>
  );

  return (
    <div className="py-1">
      <CommentItem comment={root} replyTo={null} handlers={handlers} onReply={() => setReplyingId(root.id)} />
      {(replies.length > 0 || replyingId) && (
        <div className="ml-11">
          {composerFor(root)}
          {shown.map(({ comment, replyTo }) => (
            <div key={comment.id}>
              <CommentItem comment={comment} replyTo={replyTo} handlers={handlers} onReply={() => setReplyingId(comment.id)} />
              {composerFor(comment)}
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

export function LessonQa({
  comments = MOCK_LESSON_QA,
  onSubmit = () => {},
  onRetry = () => {},
  onDelete = () => {},
  onReport = () => {},
}: { comments?: QaComment[] } & Partial<Handlers>) {
  const handlers = { onSubmit, onRetry, onDelete, onReport };
  return (
    <section className="max-w-2xl">
      <h2 className="mb-3 text-base font-semibold text-foreground">
        Hỏi đáp <span className="font-normal text-muted-foreground">{countSent(comments)}</span>
      </h2>
      {comments.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chưa có câu hỏi nào cho bài này</p>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((c) => <Thread key={c.id} root={c} handlers={handlers} />)}
        </div>
      )}
      <div className="mt-5 border-t border-border pt-5">
        <Composer placeholder="Đặt câu hỏi về bài học…" submitLabel="Gửi câu hỏi" onSubmit={(c) => onSubmit(c, null)} />
      </div>
    </section>
  );
}
