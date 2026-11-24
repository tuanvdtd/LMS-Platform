'use client';
// src/components/messages/message-bubble.tsx — Một bong bóng tin: chữ qua linkify, giờ khi rê/chạm, trạng thái gửi.

import { useState } from 'react';
import { linkify, timeLabel } from '@/lib/messages';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ImageViewer } from '@/components/messages/image-viewer';
import { UserAvatar } from '@/components/messages/user-avatar';
import type { MessageDto, MessageUser } from '@/types/message';

// Tin tạm của gửi lạc quan có status; tin thật không có.
export type LocalMessage = MessageDto & { status?: 'sending' | 'failed' };

export function MessageBubble({
  message,
  mine,
  other,
  showAvatar,
  isLastInRun,
  onRetry,
  onRemove,
  onImageError,
}: {
  message: LocalMessage;
  mine: boolean;
  other: MessageUser;
  showAvatar: boolean; // avatar người kia ở cuối mỗi run
  isLastInRun: boolean;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onImageError?: () => void; // link ảnh ký hết hạn → cha tải lại tin để lấy link mới
}) {
  const [timeOpen, setTimeOpen] = useState(false); // chạm trên màn cảm ứng; rê chuột dùng group-hover
  const [viewer, setViewer] = useState<number | null>(null);
  const parts = linkify(message.body);
  const imgs = message.images;
  const sender = mine ? 'bạn' : other.name;

  return (
    <div className={cn('flex items-end gap-2', mine ? 'flex-row-reverse' : 'flex-row')}>
      {!mine && (showAvatar ? <UserAvatar user={other} size="sm" className="mb-0.5" /> : <span className="size-6 shrink-0" aria-hidden />)}
      <div className={cn('group flex min-w-0 max-w-[80%] flex-col gap-1', mine ? 'items-end' : 'items-start')}>
        <div className={cn('flex items-center gap-2', mine && 'flex-row-reverse')}>
          <div
            onClick={(e) => !(e.target instanceof HTMLAnchorElement) && setTimeOpen((o) => !o)}
            className={cn(
              'min-w-0 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap',
              imgs.length > 0 && !message.body ? 'p-1' : 'px-3.5 py-2',
              mine ? 'bg-primary text-primary-foreground' : 'border bg-card text-foreground',
              isLastInRun && (mine ? 'rounded-br-md' : 'rounded-bl-md'),
              message.status === 'sending' && 'opacity-60',
              message.status === 'failed' && 'ring-2 ring-destructive/40',
            )}
          >
            {imgs.length > 0 && (
              <div className={cn('grid w-64 max-w-full gap-1 sm:w-72', imgs.length > 1 && 'grid-cols-2', message.body && 'mb-1.5')}>
                {imgs.map((im, i) => (
                  <button
                    key={im.key}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewer(i);
                    }}
                    aria-label={`Xem ảnh ${i + 1}/${imgs.length}`}
                    className="overflow-hidden rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- URL ký tạm của R2, không đi qua next/image */}
                    <img
                      src={im.url}
                      alt={`Ảnh ${i + 1}/${imgs.length} do ${sender} gửi`}
                      loading="lazy"
                      onError={onImageError}
                      className={cn('w-full', imgs.length === 1 ? 'aspect-[4/3] max-h-80 bg-muted object-contain' : 'aspect-square object-cover')}
                    />
                  </button>
                ))}
              </div>
            )}
            {message.body && parts.map((p, i) =>
              p.type === 'link' ? (
                <a
                  key={i}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={cn('underline underline-offset-2 break-all', mine ? 'text-primary-foreground' : 'text-primary')}
                >
                  {p.value}
                </a>
              ) : (
                <span key={i}>{p.value}</span>
              ),
            )}
          </div>
          {!message.status && (
            <time
              dateTime={message.createdAt}
              className={cn(
                'shrink-0 text-xs text-muted-foreground tabular-nums transition-opacity group-hover:opacity-100',
                timeOpen ? 'opacity-100' : 'opacity-0',
              )}
            >
              {timeLabel(message.createdAt)}
            </time>
          )}
        </div>
        <ImageViewer images={imgs} index={viewer} sender={sender} onIndexChange={setViewer} onClose={() => setViewer(null)} onImageError={onImageError} />
        {message.status === 'failed' && (
          <div className="flex items-center gap-1 text-xs text-danger">
            <span className="font-medium">Chưa gửi được.</span>
            <Button variant="link" size="xs" className="h-auto px-1 text-xs" onClick={() => onRetry(message.id)}>
              Gửi lại
            </Button>
            <Button variant="link" size="xs" className="h-auto px-1 text-xs text-muted-foreground" onClick={() => onRemove(message.id)}>
              Xoá
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
