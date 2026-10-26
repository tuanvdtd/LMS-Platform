// …/_components/video-player.tsx
'use client';

import { type RefObject, useRef, useState } from 'react';
import { Clapperboard, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Lecture } from '@/types/learn';
import { MediaState } from './media-state';
import { useVideoProgress } from './use-video-progress';

// <video> gốc + tự hồi phục khi link ký hết hạn: lỗi → xin link mới 1 lần, quay lại đúng giây.
export function VideoPlayer({
  courseSlug,
  lecture,
  videoRef,
  onCompleted,
  onRefreshUrl,
}: {
  courseSlug: string;
  lecture: Lecture;
  videoRef: RefObject<HTMLVideoElement | null>;
  onCompleted: (progressPct: number) => void;
  onRefreshUrl: () => Promise<string | null>;
}) {
  const [src, setSrc] = useState(lecture.mediaUrl);
  const [failed, setFailed] = useState(false);
  const retried = useRef(false);
  const startSec = lecture.progress.lastPositionSec < lecture.durationSec - 5 ? lecture.progress.lastPositionSec : 0;
  const resumeAt = useRef(startSec);
  const tracking = useVideoProgress({
    courseSlug,
    itemId: lecture.id,
    enabled: !lecture.manualComplete,
    completed: lecture.progress.completed,
    startPositionSec: startSec,
    onCompleted,
  });

  async function recover() {
    if (retried.current) {
      setFailed(true);
      return;
    }
    retried.current = true;
    resumeAt.current = videoRef.current?.currentTime || resumeAt.current;
    try {
      const url = await onRefreshUrl();
      if (url) setSrc(url);
      else setFailed(true);
    } catch {
      setFailed(true);
    }
  }

  if (!src) {
    return <MediaState icon={Clapperboard} title="Video chưa sẵn sàng" text="Video đang được xử lý, quay lại sau ít phút nhé." />;
  }
  if (failed) {
    return (
      <MediaState icon={TriangleAlert} title="Không tải được video" text="Kiểm tra kết nối mạng rồi thử lại.">
        <Button className="h-11" onClick={() => { retried.current = false; setFailed(false); void recover(); }}>
          Thử lại
        </Button>
      </MediaState>
    );
  }
  return (
    <div className="bg-black">
      <video
        ref={videoRef}
        key={src}
        src={src}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload"
        className="mx-auto aspect-video max-h-[calc(100dvh-10rem)] w-full"
        onLoadedMetadata={(e) => {
          if (resumeAt.current > 0) e.currentTarget.currentTime = resumeAt.current;
        }}
        onPlaying={() => { retried.current = false; }} // phát được → lần hết hạn sau vẫn tự hồi phục
        onError={() => void recover()}
        {...tracking}
      />
    </div>
  );
}
