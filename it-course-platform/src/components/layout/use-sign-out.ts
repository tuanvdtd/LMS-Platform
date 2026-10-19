'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { isPrivatePath } from '@/lib/private-routes';

// Trang công khai → ở lại; trang riêng tư → về '/' (proxy sẽ đá sang /login nếu ở lại). Spec guest-ui §4.6.
export function useSignOut() {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const { error } = await authClient.signOut().catch(() => ({ error: true }));
    if (error) {
      setPending(false);
      toast.error('Đăng xuất thất bại, thử lại');
      return;
    }
    const { pathname, search } = window.location;
    // Tải lại toàn trang: cacheComponents giữ các route đã rời bằng <Activity> kèm state của user cũ,
    // router.refresh() không xoá chúng (docs preserving-ui-state § State and authentication).
    window.location.replace(isPrivatePath(pathname) ? '/' : pathname + search);
  }

  return { signOut, pending };
}
