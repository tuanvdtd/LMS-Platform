'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthShell } from './auth-shell';
import { RESEND_COOLDOWN } from './auth-messages';
import { AuthSteps } from './form-parts';
import { useCooldown } from './use-cooldown';

type Props = {
  title: string;
  children: React.ReactNode;
  /** Các bước của luồng; bước đầu (gửi email) coi như đã xong. */
  steps: string[];
  /** Trả câu lỗi để hiển thị, hoặc null nếu gửi được. */
  onResend: () => Promise<string | null>;
  footer: React.ReactNode;
};

export function CheckEmailScreen({ title, children, steps, onResend, footer }: Props) {
  // Bắt đầu đã khoá: mail vừa được gửi
  const { cooldown, restart } = useCooldown(RESEND_COOLDOWN);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setError(null);
    restart();
    setError(await onResend());
  }

  return (
    <AuthShell title={title} mail>
      <div className="space-y-3">{children}</div>
      <AuthSteps steps={steps} done={1} />
      <Button variant="outline" size="lg" className="mt-8 w-full" disabled={cooldown > 0} onClick={resend}>
        {cooldown > 0 ? `Gửi lại email (${cooldown}s)` : 'Gửi lại email'}
      </Button>
      {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
      <div className="mt-4 text-center text-sm">{footer}</div>
    </AuthShell>
  );
}
