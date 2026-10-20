// …/lecture/[itemId]/_components/use-video-progress.ts
'use client';

import { type SyntheticEvent, useCallback, useEffect, useRef } from 'react';
import { sendProgress } from '@/lib/api/learn';

const HEARTBEAT_MS = 30_000;
const BUCKET_SEC = 10; // khớp BE src/learn/watch-bitmap.ts
const MAX_STEP_SEC = 2; // bước timeupdate lớn hơn (hoặc lùi) = tua → không tính đoạn bị nhảy qua

// Theo dõi đoạn đã phát thật, gửi 30s/lần + khi pause/ended/ẩn tab/rời bài (spec 2026-10-20-lecture-player §4.1).
// Trả về handler gắn thẳng vào <video> → video remount (đổi src khi link hết hạn) không mất listener.
// ponytail: đóng tab đột ngột có thể mất ≤ 30s (không dùng fetch keepalive — xem spec §4.1).
export function useVideoProgress({
  courseSlug,
  itemId,
  enabled,
  completed,
  startPositionSec,
  onCompleted,
}: {
  courseSlug: string;
  itemId: string;
  enabled: boolean;
  completed: boolean;
  startPositionSec: number; // điểm resume đã lưu: chưa xem gì thì không gửi đè lastPositionSec
  onCompleted: (progressPct: number) => void;
}) {
  const pending = useRef(new Set<number>());
  const lastTime = useRef<number | null>(null);
  const position = useRef(startPositionSec);
  const sentPosition = useRef(startPositionSec);
  const flushAgain = useRef(false);
  const flushRef = useRef<() => void>(() => {}); // flush tự gọi lại qua ref (lint: không tham chiếu chính nó)
  const stopped = useRef(!enabled);
  const inflight = useRef(false);
  const done = useRef(completed);
  const onCompletedRef = useRef(onCompleted);
  useEffect(() => {
    onCompletedRef.current = onCompleted;
  });

  const flush = useCallback(() => {
    if (stopped.current) return;
    if (inflight.current) {
      flushAgain.current = true; // gửi nốt khi request hiện tại xong (pause/ẩn tab/rời bài không bị bỏ)
      return;
    }
    const buckets = [...pending.current];
    const positionSec = Math.floor(position.current);
    if (!buckets.length && positionSec === sentPosition.current) return;
    pending.current.clear();
    inflight.current = true;
    sendProgress(courseSlug, itemId, { positionSec, buckets })
      .then(
        (r) => {
          sentPosition.current = positionSec;
          if (r.completed && !done.current) {
            done.current = true;
            onCompletedRef.current(r.progressPct);
          }
        },
        (e) => {
          const status = (e as { response?: { status?: number } }).response?.status;
          if (status === 403 || status === 404 || status === 409) stopped.current = true; // mất ghi danh / bài đổi loại
          else if (status !== 429) buckets.forEach((b) => pending.current.add(b)); // lỗi mạng: gửi kèm lần sau
        },
      )
      .finally(() => {
        inflight.current = false;
        if (flushAgain.current) {
          flushAgain.current = false;
          flushRef.current();
        }
      });
  }, [courseSlug, itemId]);
  useEffect(() => {
    flushRef.current = flush;
  });

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
      const v = e.currentTarget;
      const t = v.currentTime;
      const prev = lastTime.current;
      if (!v.seeking && prev !== null && t > prev && t - prev <= MAX_STEP_SEC) {
        for (let b = Math.floor(prev / BUCKET_SEC); b <= Math.floor(t / BUCKET_SEC); b++) pending.current.add(b);
      }
      lastTime.current = t;
      position.current = t;
    },
    onSeeked: (e: SyntheticEvent<HTMLVideoElement>) => {
      lastTime.current = e.currentTarget.currentTime;
      position.current = e.currentTarget.currentTime;
    },
    onPause: flush,
    onEnded: flush,
  };
}
