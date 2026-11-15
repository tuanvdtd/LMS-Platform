'use client';

import { useEffect, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { NETWORK } from '@/app/(auth)/_components/auth-messages';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';
import { fullTime } from '@/lib/time-ago';
import { describeDevice } from '@/lib/user-agent';
import { type AuthError, securityError } from './messages';

type Session = { id: string; token: string; userAgent?: string | null; ipAddress?: string | null; createdAt: Date | string };
type State =
  | { status: 'loading' }
  | { status: 'error'; stale: boolean; message: string }
  | { status: 'ready'; sessions: Session[] };

const ALL = 'all';
const RELOGIN = 'relogin';

async function fetchSessions(currentId: string): Promise<State> {
  try {
    const { data, error } = await authClient.listSessions();
    if (error) return { status: 'error', stale: error.code === 'SESSION_NOT_FRESH', message: securityError(error) };
    const time = (s: Session) => new Date(s.createdAt).getTime();
    // Thiết bị này lên đầu, còn lại mới nhất trước.
    const sessions = [...(data as Session[])].sort(
      (a, b) => Number(b.id === currentId) - Number(a.id === currentId) || time(b) - time(a),
    );
    return { status: 'ready', sessions };
  } catch {
    return { status: 'error', stale: false, message: NETWORK };
  }
}

// Các thiết bị đang giữ phiên đăng nhập. Xem danh sách cần phiên "tươi" (đăng nhập trong 24 giờ, freshAge của Better Auth):
// kẻ nhặt được cookie cũ không dò được thiết bị của chủ tài khoản.
export function SessionsList({ currentId }: { currentId: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [pending, setPending] = useState<string | null>(null);

  const load = () => fetchSessions(currentId).then(setState);
  useEffect(() => {
    void fetchSessions(currentId).then(setState);
  }, [currentId]);

  async function revoke(key: string, action: () => Promise<{ error: AuthError | null }>, done: string) {
    setPending(key);
    try {
      const { error } = await action();
      if (error) toast.error(securityError(error));
      else {
        toast.success(done);
        await load();
      }
    } catch {
      toast.error(NETWORK);
    }
    setPending(null);
  }

  // Đăng nhập lại để có phiên mới, rồi quay về đúng tab này.
  async function signInAgain() {
    setPending(RELOGIN);
    await authClient.signOut().catch(() => undefined);
    // Tải lại toàn trang như useSignOut: không giữ state của phiên cũ.
    const back = `${window.location.pathname}?tab=security`;
    window.location.replace(`/login?redirect=${encodeURIComponent(back)}`);
  }

  if (state.status === 'loading') {
    return (
      <div role="status" aria-busy="true" aria-label="Đang tải phiên đăng nhập" className="divide-y rounded-lg border">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-9 rounded-md" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <Alert variant={state.stale ? 'default' : 'destructive'}>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>
            {state.stale
              ? 'Phiên hiện tại đã quá 24 giờ. Đăng nhập lại để xem và đăng xuất các thiết bị.'
              : state.message}
          </span>
          {state.stale ? (
            <Button size="sm" variant="outline" isLoading={pending === RELOGIN} onClick={signInAgain}>
              Đăng nhập lại
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setState({ status: 'loading' });
                void load();
              }}
            >
              Thử lại
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const others = state.sessions.filter((s) => s.id !== currentId);
  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y rounded-lg border">
        {state.sessions.map((s) => {
          const device = describeDevice(s.userAgent);
          const Icon = device.mobile ? Smartphone : Monitor;
          const current = s.id === currentId;
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-foreground">
                  {device.label}
                  {current && <Badge className="bg-success-soft text-success">Thiết bị này</Badge>}
                </p>
                <p className="text-sm text-muted-foreground">
                  Đăng nhập {fullTime(new Date(s.createdAt).toISOString())}
                  {s.ipAddress && (
                    <>
                      {' · IP '}
                      <span className="font-mono text-[0.8125rem]">{s.ipAddress}</span>
                    </>
                  )}
                </p>
              </div>
              {!current && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending !== null && pending !== s.id}
                  isLoading={pending === s.id}
                  onClick={() => revoke(s.id, () => authClient.revokeSession({ token: s.token }), 'Đã đăng xuất thiết bị')}
                >
                  Đăng xuất
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {others.length > 0 && (
        <div>
          <Button
            variant="destructive"
            size="sm"
            disabled={pending !== null && pending !== ALL}
            isLoading={pending === ALL}
            onClick={() => revoke(ALL, () => authClient.revokeOtherSessions(), 'Đã đăng xuất mọi thiết bị khác')}
          >
            Đăng xuất khỏi {others.length} thiết bị khác
          </Button>
        </div>
      )}
    </div>
  );
}
