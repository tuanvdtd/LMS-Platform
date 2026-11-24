'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Chép link bài. Trình duyệt chặn clipboard (http, iframe) → báo để người dùng tự chép từ thanh địa chỉ.
export function ShareButton({ slug }: { slug: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/blog/${slug}`);
      toast.success('Đã chép link bài viết');
    } catch {
      toast.error('Không chép được link, hãy mở bài và chép từ thanh địa chỉ');
    }
  }

  return (
    <Button variant="ghost" onClick={() => void copy()}>
      <Share2 data-icon="inline-start" />
      Chia sẻ
    </Button>
  );
}
