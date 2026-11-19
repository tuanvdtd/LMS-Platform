'use client';

import { useEffect, useState } from 'react';
import { getPostPermission } from '@/lib/api/my-posts';

// Có hiện mục "Bài viết của tôi" không. Chỉ để ẩn/hiện menu: quyền thật do BE kiểm ở từng API.
export function useCanWritePosts(userId: string | undefined): boolean {
  const [allowedFor, setAllowedFor] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) return;
    let stale = false;
    getPostPermission().then(
      (r) => {
        if (!stale) setAllowedFor(r.canWrite ? userId : null);
      },
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [userId]);
  return !!userId && allowedFor === userId;
}
