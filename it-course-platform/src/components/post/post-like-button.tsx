'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiMessage } from '@/lib/api/checkout';
import { getLike, setLike } from '@/lib/api/post-engagement';
import { authClient } from '@/lib/auth-client';
import { loginUrlFor, parseAction, withoutAction } from '@/lib/resume-action';
import { cn } from '@/lib/utils';
import type { LikeState } from '@/types/post';

// Đổi trạng thái ngay, gửi ở nền. Bấm liên tục: chỉ gửi trạng thái cuối cùng, không gửi chồng.
// Khách bấm → đăng nhập → quay lại với ?action=like → tự thả tim một lần.
// preview: bản xem trước của tác giả / trang xem thử giao diện, không gọi API.
// inFeed: nút ở luồng /blog (nhiều nút một trang). Khách bấm → đăng nhập rồi về trang bài đó tự tim,
// không tự tim tại luồng (?action=like ở /blog sẽ làm mọi nút cùng tim).
// ponytail: mỗi nút ở luồng tự GET trạng thái tim (≤ 12 request/trang); đông người thì gộp thành một API theo danh sách slug.
export function PostLikeButton({
  slug,
  initialCount,
  preview = false,
  inFeed = false,
}: {
  slug: string;
  initialCount: number;
  preview?: boolean;
  inFeed?: boolean;
}) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<LikeState>({ liked: false, likeCount: initialCount });
  const want = useRef<boolean | null>(null);
  const sending = useRef(false);
  const resumed = useRef(false);
  const touched = useRef(false); // đã bấm (hoặc tự tim sau đăng nhập) → bỏ qua kết quả GET về muộn
  const userId = session?.user.id;

  // Số trên trang bài có thể cũ tới 60 giây → người đã đăng nhập lấy số thật + đã tim chưa.
  useEffect(() => {
    if (preview || !userId) return;
    let cancelled = false;
    getLike(slug).then(
      (s) => {
        if (!cancelled && !touched.current) setState(s);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [slug, userId, preview]);

  async function flush() {
    if (sending.current) return;
    sending.current = true;
    try {
      while (want.current !== null) {
        const target = want.current;
        want.current = null;
        try {
          const s = await setLike(slug, target);
          if (want.current === null) setState(s);
        } catch (e) {
          if (want.current === null) {
            setState((p) => (p.liked === target ? { liked: !target, likeCount: p.likeCount + (target ? -1 : 1) } : p));
            toast.error(apiMessage(e, 'Chưa lưu được lượt thích, thử lại sau'));
          }
        }
      }
    } finally {
      sending.current = false;
    }
  }

  function apply(next: boolean) {
    touched.current = true;
    setState((p) => (p.liked === next ? p : { liked: next, likeCount: p.likeCount + (next ? 1 : -1) }));
    if (preview) return;
    want.current = next;
    void flush();
  }

  function toggle() {
    if (!preview && !session) {
      router.push(inFeed ? loginUrlFor(`/blog/${slug}`, '', 'like') : loginUrlFor(window.location.pathname, window.location.search, 'like'));
      return;
    }
    apply(!state.liked);
  }

  useEffect(() => {
    if (inFeed || preview || resumed.current || isPending || !session || parseAction(searchParams.get('action')) !== 'like') return;
    resumed.current = true;
    router.replace(withoutAction(window.location.pathname, window.location.search), { scroll: false });
    apply(true);
    // apply đọc state qua setState(fn) và ref nên không cần trong deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inFeed, preview, isPending, session, searchParams, router]);

  return (
    <Button
      variant={inFeed ? 'ghost' : 'outline'}
      aria-pressed={state.liked}
      aria-label={state.liked ? `Bỏ thích bài viết (${state.likeCount} lượt thích)` : `Thích bài viết (${state.likeCount} lượt thích)`}
      onClick={toggle}
    >
      <Heart data-icon="inline-start" className={cn(state.liked && 'fill-primary text-primary')} />
      <span className="tabular-nums">{state.likeCount}</span>
    </Button>
  );
}
