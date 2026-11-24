// …/lecture/[itemId]/_components/use-video-progress.ts
'use client';

import { type SyntheticEvent, useCallback, useEffect, useRef } from 'react';
import { sendProgress } from '@/lib/api/learn';
import { createTracker, onPlaying, onSeeked, onStop, onTimeUpdate, restore, takePending } from '@/lib/watch-segments';

const HEARTBEAT_MS = 60_000;

// Lưu vị trí xem dở để học tiếp: gửi khi pause (kể cả lúc hết video), ẩn tab, rời bài và 60s/lần
// (phòng đóng tab, crash, xem liền không pause). Không liên quan hoàn thành bài.
// Kèm các đoạn đã xem (viewId = một lần mở bài) cho dashboard giữ chân video của giảng viên.
// ponytail: đóng tab đột ngột có thể mất ≤ 60s vị trí (axios không có keepalive).
export function useVideoProgress({
  courseSlug,
  itemId,
  startPositionSec,
}: {
  courseSlug: string;
  itemId: string;
  startPositionSec: number; // chưa xem gì thì không gửi đè vị trí đã lưu
}) {
  const position = useRef(startPositionSec);
  const sent = useRef(Math.floor(startPositionSec));
  const inflight = useRef(false);
  const stopped = useRef(false);
  const again = useRef(false);
  const flushRef = useRef<() => void>(() => {});
  const tracker = useRef(createTracker());
  const viewId = useRef<string | null>(null);
  viewId.current ??= crypto.randomUUID();

  const flush = useCallback(() => {
    if (stopped.current) return;
    if (inflight.current) {
      again.current = true; // đang gửi: gửi lại ngay khi xong, không bỏ lượt
      return;
    }
    const pos = Math.floor(position.current);
    const segs = takePending(tracker.current);
    if (pos === sent.current && !segs.length) return;
    inflight.current = true;
    sendProgress(courseSlug, itemId, {
      positionSec: pos,
      ...(segs.length ? { viewId: viewId.current!, segments: segs } : {}),
    })
      .then(
        () => {
          sent.current = pos;
        },
        (e) => {
          const status = (e as { response?: { status?: number } }).response?.status;
          if (status === 403 || status === 404 || status === 409) stopped.current = true; // mất ghi danh / bài đổi loại
          else if (status === undefined || status >= 500 || status === 429) restore(tracker.current, segs); // lần sau gửi lại
        },
      )
      .finally(() => {
        inflight.current = false;
        if (again.current) {
          again.current = false;
          flushRef.current();
        }
      });
  }, [courseSlug, itemId]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    const timer = setInterval(flush, HEARTBEAT_MS);
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
      flush(); // rời bài trong app → gửi nốt
    };
  }, [flush]);

  return {
    onTimeUpdate: (e: SyntheticEvent<HTMLVideoElement>) => {
      position.current = e.currentTarget.currentTime;
      onTimeUpdate(tracker.current, e.currentTarget.currentTime);
    },
    onPlaying: (e: SyntheticEvent<HTMLVideoElement>) => onPlaying(tracker.current, e.currentTarget.currentTime),
    onSeeking: () => onStop(tracker.current),
    onSeeked: (e: SyntheticEvent<HTMLVideoElement>) => {
      position.current = e.currentTarget.currentTime;
      onSeeked(tracker.current, e.currentTarget.currentTime, e.currentTarget.paused);
    },
    onPause: () => {
      onStop(tracker.current);
      flush();
    },
    onEnded: () => onStop(tracker.current),
  };
}
