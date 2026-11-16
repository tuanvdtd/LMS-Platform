'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { NETWORK } from '@/app/(auth)/_components/auth-messages';
import { PROVIDERS, type Provider } from '@/app/(auth)/_components/social-buttons';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { type AuthError, securityError } from './messages';

export type LinkedAccount = { id: string; providerId: string; createdAt: Date | string };

const date = (d: Date | string) => new Date(d).toLocaleDateString('vi-VN');

// Google / GitHub gắn vào tài khoản này. Cách đăng nhập cuối cùng không huỷ được (back-end cũng chặn).
export function LinkedAccounts({ accounts, onChange }: { accounts: LinkedAccount[]; onChange: () => void }) {
  const [pending, setPending] = useState<Provider['id'] | null>(null);
  const only = accounts.length === 1;

  async function run(id: Provider['id'], action: () => Promise<{ error: AuthError | null }>, done?: string) {
    setPending(id);
    try {
      const { error } = await action();
      if (error) toast.error(securityError(error));
      else if (done) {
        toast.success(done);
        onChange();
      }
    } catch {
      toast.error(NETWORK);
    }
    setPending(null);
  }

  // Thành công → Better Auth chuyển sang trang của provider rồi quay về đúng trang này, tab Bảo mật.
  const link = ({ id }: Provider) => {
    const here = `${window.location.origin}${window.location.pathname}?tab=security`;
    return run(id, () => authClient.linkSocial({ provider: id, callbackURL: here, errorCallbackURL: here }));
  };
  const unlink = ({ id, label }: Provider, accountId: string) =>
    run(id, () => authClient.unlinkAccount({ accountId }), `Đã huỷ liên kết ${label}`);

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y rounded-lg border">
        {PROVIDERS.map((p) => {
          const linked = accounts.find((a) => a.providerId === p.id);
          return (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted" aria-hidden>
                {p.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{p.label}</p>
                <p className="text-sm text-muted-foreground">
                  {linked ? `Đã liên kết từ ${date(linked.createdAt)}` : 'Chưa liên kết'}
                </p>
              </div>
              {linked ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={only || (pending !== null && pending !== p.id)}
                  isLoading={pending === p.id}
                  onClick={() => unlink(p, linked.id)}
                >
                  Huỷ liên kết
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending !== null && pending !== p.id}
                  isLoading={pending === p.id}
                  onClick={() => link(p)}
                >
                  Liên kết
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {only && accounts[0].providerId !== 'credential' && (
        <p className="text-sm text-muted-foreground">
          Đây là cách đăng nhập duy nhất của bạn. Muốn huỷ liên kết, hãy tạo mật khẩu hoặc liên kết thêm một tài khoản
          khác trước.
        </p>
      )}
    </div>
  );
}
