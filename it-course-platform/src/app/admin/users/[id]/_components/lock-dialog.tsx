'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { LOCK_DURATION_LABEL, LOCK_REASON_MAX, LOCK_REASON_MIN } from '@/lib/admin-users';
import { lockUser } from '@/lib/api/admin';
import { apiMessage } from '@/lib/api/checkout';
import type { AdminUserDetail, LockDuration } from '@/types/admin';

const DURATIONS = Object.keys(LOCK_DURATION_LABEL) as LockDuration[];
const TOO_SHORT = `Lý do tối thiểu ${LOCK_REASON_MIN} ký tự`;

export function LockDialog({
  user,
  onClose,
  onLocked,
}: {
  user: { id: string; name: string } | null;
  onClose: () => void;
  onLocked: (u: AdminUserDetail) => void;
}) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<LockDuration>('7d');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const tooShort = reason.trim().length < LOCK_REASON_MIN;
  const error = serverError ?? (touched && tooShort ? TOO_SHORT : null);

  function close() {
    if (saving) return;
    setReason('');
    setDuration('7d');
    setTouched(false);
    setServerError(null);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setTouched(true);
    if (tooShort) return;
    setSaving(true);
    setServerError(null);
    try {
      const res = await lockUser(user.id, { reason: reason.trim(), duration });
      toast.success('Đã khoá tài khoản');
      setReason('');
      setDuration('7d');
      setTouched(false);
      onLocked(res);
    } catch (err) {
      setServerError(apiMessage(err, 'Không khoá được tài khoản, thử lại'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Khoá tài khoản {user?.name}</DialogTitle>
            <DialogDescription className="sr-only">Nhập lý do và thời hạn khoá.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lock-reason">Lý do</Label>
            <Textarea
              id="lock-reason"
              value={reason}
              maxLength={LOCK_REASON_MAX}
              rows={4}
              onChange={(e) => {
                setReason(e.target.value);
                setServerError(null);
              }}
              onBlur={() => setTouched(true)}
              aria-invalid={!!error}
              aria-describedby="lock-reason-hint"
              disabled={saving}
            />
            <div className="flex justify-between gap-3 text-xs">
              <span id="lock-reason-hint" className={error ? 'text-destructive' : 'text-muted-foreground'} role={error ? 'alert' : undefined}>
                {error ?? 'Người dùng sẽ thấy lý do này trong email'}
              </span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {reason.length}/{LOCK_REASON_MAX}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label id="lock-duration-label">Thời hạn</Label>
            <RadioGroup
              aria-labelledby="lock-duration-label"
              value={duration}
              onValueChange={(v) => setDuration(v as LockDuration)}
              className="flex flex-row flex-wrap gap-4"
              disabled={saving}
            >
              {DURATIONS.map((d) => (
                <Label key={d} htmlFor={`lock-d-${d}`} className="gap-2 font-normal">
                  <RadioGroupItem id={`lock-d-${d}`} value={d} />
                  {LOCK_DURATION_LABEL[d]}
                </Label>
              ))}
            </RadioGroup>
          </div>

          <p className="text-sm text-muted-foreground">
            Người dùng bị đăng xuất ngay khỏi mọi thiết bị, không đăng nhập được tới khi hết hạn hoặc được mở khoá, và nhận email nêu lý do. Khoá
            học của họ (nếu là giảng viên) vẫn đang bán.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={saving}>
              Huỷ
            </Button>
            <Button type="submit" variant="destructive" disabled={saving}>
              {saving ? 'Đang khoá…' : 'Khoá tài khoản'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
