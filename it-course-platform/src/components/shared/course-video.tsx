'use client';

import { type ComponentProps, type Ref, useCallback, useEffect, useMemo, useRef } from 'react';
import { I18nProvider } from '@videojs/react/i18n';
// Đăng ký tĩnh: locale nạp lười sẽ hiện tiếng Anh ở lần render đầu.
import '@videojs/react/i18n/locales/vi/register';
import { HlsJsVideo, type HlsJsAdapter, type PreloadType } from '@videojs/react/media/hlsjs-video';
import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video';
import '@videojs/react/video/skin.css';

// Chữ ký HLS sống 10 phút: đổi trước 1 phút; lỗi / video vừa bị thay thì thử lại sau 30 giây.
const REFRESH_MS = 9 * 60_000;
const RETRY_MS = 30_000;

type Props = Omit<ComponentProps<'video'>, 'src' | 'ref' | 'controls' | 'preload' | 'onError'> & {
  src: string;
  preload?: PreloadType;
  // Không kèm event: lỗi HLS đến từ adapter của hls.js, không phải sự kiện React của <video>.
  onError?: () => void;
  onRefreshUrl?: () => Promise<string | null>;
  ref?: Ref<HTMLVideoElement>;
};

// Player video bài giảng: HLS (.m3u8, ký CloudFront wildcard) qua hls.js, MP4 cũ qua <video>. Skin mặc định
// của Video.js, nhãn tiếng Việt; tua ±10s bằng phím j/l/←/→ hoặc chạm đúp hai bên.
// Playlist con/segment là đường dẫn tương đối nên không mang query chữ ký → xhrSetup gắn chữ ký hiện tại vào mọi
// request cùng host. Caller phải remount (key={src}) khi đổi video. Timer đổi chữ ký ngầm (chỉ đổi query, không reload). Luôn dùng hls.js (MSE), kể cả Safari:
// HLS native của Safari tự tải segment, không gắn được chữ ký → 403.
export function CourseVideo({ src, onRefreshUrl, ref, className, onError, ...media }: Props) {
  const isHls = new URL(src).pathname.endsWith('.m3u8');
  const sigRef = useRef(new URL(src).search.slice(1));
  // Đọc qua ref: caller truyền hàm inline không làm reset timer / gắn lại listener.
  const refreshRef = useRef(onRefreshUrl);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    refreshRef.current = onRefreshUrl;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!isHls) return;
    const path = new URL(src).pathname;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const tick = async () => {
      let next: URL;
      try {
        const url = await refreshRef.current?.();
        if (cancelled) return;
        // null = không còn URL (không phải lỗi mạng): dừng timer.
        if (!url) return;
        next = new URL(url);
      } catch {
        // lỗi mạng: thử lại sau
        if (!cancelled) timer = setTimeout(() => void tick(), RETRY_MS);
        return;
      }
      // Video đã bị thay (pathname khác): không ghi chữ ký của tài nguyên khác, để hết hạn rồi caller tự hồi phục.
      if (next.pathname !== path) return;
      sigRef.current = next.search.slice(1);
      timer = setTimeout(() => void tick(), REFRESH_MS);
    };
    timer = setTimeout(() => void tick(), REFRESH_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [src, isHls]);

  // Cùng tham chiếu giữa các lần render: adapter so engine bằng deepEqual, hàm mới → dựng lại engine → reload.
  const source = useMemo(() => {
    const host = new URL(src).host;
    return {
      src,
      type: 'application/vnd.apple.mpegurl',
      preferPlayback: 'mse',
      engine: {
        hlsJs: {
          xhrSetup(xhr: XMLHttpRequest, url: string) {
            const u = new URL(url);
            if (u.host !== host) return;
            u.search = sigRef.current;
            xhr.open('GET', u.href, true);
          },
        },
      },
    };
  }, [src]);

  // Lỗi fatal của hls.js không tới onError của <video> (video.error vẫn null): adapter phát sự kiện 'error' trên
  // chính nó, kèm chuyển tiếp lỗi native của <video> → nghe ở adapter và không gắn onError vào <video> để khỏi gọi 2 lần.
  const setMediaRef = useCallback((adapter: HlsJsAdapter | null) => {
    if (!adapter) return;
    // Adapter phát cả lỗi fatal của hls.js lẫn lỗi native chuyển tiếp: chỉ báo caller một lần mỗi lần gắn adapter.
    let fired = false;
    const handle = () => {
      if (fired) return;
      fired = true;
      onErrorRef.current?.();
    };
    adapter.addEventListener('error', handle);
    return () => adapter.removeEventListener('error', handle);
  }, []);

  return (
    <I18nProvider locale="vi">
      <VideoPlayer>
        <VideoSkin className={className}>
          {isHls ? (
            <HlsJsVideo ref={ref} mediaRef={setMediaRef} source={source} playsInline {...media} />
          ) : (
            <Video ref={ref} src={src} playsInline onError={onError} {...media} />
          )}
        </VideoSkin>
      </VideoPlayer>
    </I18nProvider>
  );
}
