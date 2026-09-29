'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

// Đặt ở root layout: trang auth, learn, onboarding không có Header.
// Dùng chung store useSession với Header → không gọi get-session trùng với Header.
export function SentryUser() {
  const { data } = authClient.useSession();
  const id = data?.user.id;
  const role = data?.user.role ?? undefined;

  useEffect(() => {
    Sentry.setUser(id ? { id, role } : null);
  }, [id, role]);

  return null;
}
