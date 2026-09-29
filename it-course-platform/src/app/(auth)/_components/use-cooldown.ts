import { useEffect, useState } from 'react';
import { RESEND_COOLDOWN } from './auth-messages';

/** Đếm ngược từng giây về 0; restart() khoá lại RESEND_COOLDOWN giây. */
export function useCooldown(initial = 0) {
  const [cooldown, setCooldown] = useState(initial);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  return { cooldown, restart: () => setCooldown(RESEND_COOLDOWN) };
}
