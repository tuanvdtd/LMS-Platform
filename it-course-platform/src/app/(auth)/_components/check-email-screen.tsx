'use client';

import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthShell } from './auth-shell';
import { RESEND_COOLDOWN } from './auth-messages';
import { useCooldown } from './use-cooldown';

type Props = {
  title: string;
  children: React.ReactNode;
  /** Trả câu lỗi để hiển thị, hoặc null nếu gửi được. */
  onResend: () => Promise<string | null>;
  footer: React.ReactNode;
};

export function CheckEmailScreen({ title, children, onResend, footer }: Props) {
  // Bắt đầu đã khoá: mail vừa được gửi
  const { cooldown, restart } = useCooldown(RESEND_COOLDOWN);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setError(null);
    restart();
    setError(await onResend());
  }

  return (
    <AuthShell title={title}>
      <div className="text-center space-y-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-7" />
        </div>
        {children}
        <Button variant="outline" className="w-full" disabled={cooldown > 0} onClick={resend}>
          {cooldown > 0 ? `Gửi lại email (${cooldown}s)` : 'Gửi lại email'}
        </Button>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        {footer}
      </div>
    </AuthShell>
  );
}
