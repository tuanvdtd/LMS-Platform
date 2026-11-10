// …/lecture/[itemId]/_components/use-video-progress.ts
'use client';

import { type SyntheticEvent, useCallback, useEffect, useRef } from 'react';
import { sendProgress } from '@/lib/api/learn';

const HEARTBEAT_MS = 60_000;

// Lưu vị trí xem dở để học tiếp: gửi khi pause (kể cả lúc hết video), ẩn tab, rời bài và 60s/lần
// (phòng đóng tab, crash, xem liền không pause). Không liên quan hoàn thành bài.
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

  const flush = useCallback(() => {
    const pos = Math.floor(position.current);
    if (stopped.current || inflight.current || pos === sent.current) return; // đang gửi: lượt sau mang vị trí mới hơn
    inflight.current = true;
    sendProgress(courseSlug, itemId, pos)
      .then(
        () => {
          sent.current = pos;
        },
        (e) => {
          const status = (e as { response?: { status?: number } }).response?.status;
          if (status === 403 || status === 404 || status === 409) stopped.current = true; // mất ghi danh / bài đổi loại
        },
      )
      .finally(() => {
        inflight.current = false;
      });
  }, [courseSlug, itemId]);

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

  const track = (e: SyntheticEvent<HTMLVideoElement>) => {
    position.current = e.currentTarget.currentTime;
  };
  return { onTimeUpdate: track, onSeeked: track, onPause: flush };
}
