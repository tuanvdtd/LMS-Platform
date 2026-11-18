'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { RejectDialog } from '@/app/admin/_components/review-ui';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { apiMessage } from '@/lib/api/checkout';
import { adminRemovePost } from '@/lib/api/my-posts';
import { isAdmin } from '@/lib/instructor-role';

const PRESETS = [
  'Quảng cáo hoặc spam.',
  'Nội dung sai sự thật hoặc gây hiểu lầm.',
  'Có dấu hiệu vi phạm bản quyền.',
  'Ngôn từ xúc phạm hoặc gây thù ghét.',
  'Không liên quan tới công nghệ và học tập.',
];

// Nút "Gỡ bài" trên trang đọc, chỉ admin thấy. Tác giả thấy lý do ở "Bài viết của tôi" và không tự xuất bản lại được.
export function AdminPostActions({ postId }: { postId: string }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!isAdmin(session?.user)) return null;

  async function remove(reason: string) {
    setBusy(true);
    try {
      await adminRemovePost(postId, reason);
      toast.success('Đã gỡ bài', { description: 'Bài biến khỏi Blog sau tối đa 1 phút.' });
      router.push('/blog');
    } catch (err) {
      toast.error(apiMessage(err));
      setBusy(false);
    }
  }

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <EyeOff data-icon="inline-start" />
        Gỡ bài
      </Button>
      <RejectDialog
        open={open}
        onOpenChange={setOpen}
        title="Gỡ bài viết này?"
        description="Bài sẽ ẩn khỏi Blog. Tác giả thấy lý do và không tự xuất bản lại được; quản trị viên có thể mở lại về nháp."
        presets={PRESETS}
        max={500}
        busy={busy}
        onConfirm={remove}
        reasonLabel="Lý do gỡ bài"
        placeholder="Tác giả sẽ đọc lý do này."
        confirmLabel="Gỡ bài"
      />
    </div>
  );
}
