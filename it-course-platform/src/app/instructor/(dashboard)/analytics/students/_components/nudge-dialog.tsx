'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { NUDGE_MAX_CHARS, NUDGE_TEMPLATES, personalize, SKIP_REASON } from '@/lib/analytics';
import { sendNudges } from '@/lib/api/analytics';
import type { NudgeKind, StudentRow } from '@/types/analytics';

const KINDS = Object.keys(NUDGE_TEMPLATES) as NudgeKind[];

// Học viên nhận thông báo trong app + email; BE giới hạn 1 lần / 7 ngày / khoá và báo lại ai bị bỏ qua.
export function NudgeDialog({
  courseId,
  students,
  onClose,
  onSent,
}: {
  courseId: string;
  students: StudentRow[] | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const [kind, setKind] = useState<NudgeKind>('reminder');
  const [message, setMessage] = useState(NUDGE_TEMPLATES.reminder.text);
  const [busy, setBusy] = useState(false);
  const first = students?.[0];

  async function send() {
    if (!students?.length) return;
    setBusy(true);
    try {
      const r = await sendNudges(courseId, { userIds: students.map((s) => s.userId), kind, message });
      if (r.sent.length) toast.success(`Đã gửi lời nhắn cho ${r.sent.length} học viên`);
      if (r.skipped.length) {
        const name = (id: string) => students.find((s) => s.userId === id)?.name ?? 'Học viên';
        toast.warning(`Bỏ qua ${r.skipped.length} học viên`, {
          description: r.skipped.map((s) => `${name(s.userId)}: ${SKIP_REASON[s.reason]}`).join('; '),
        });
      }
      onSent();
      onClose();
    } catch {
      toast.error('Không gửi được lời nhắn, thử lại sau');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!students?.length} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{students?.length === 1 ? `Nhắc ${first!.name}` : `Nhắc ${students?.length ?? 0} học viên`}</DialogTitle>
          <DialogDescription>Học viên nhận thông báo trong Aolumi và email. Mỗi học viên được nhắc tối đa 1 lần mỗi 7 ngày.</DialogDescription>
        </DialogHeader>
        <ToggleGroup
          variant="outline"
          size="sm"
          aria-label="Mẫu lời nhắn"
          value={[kind]}
          onValueChange={(v) => {
            const k = v[0] as NudgeKind | undefined;
            if (!k) return;
            setKind(k);
            setMessage(NUDGE_TEMPLATES[k].text);
          }}
        >
          {KINDS.map((k) => (
            <ToggleGroupItem key={k} value={k}>
              {NUDGE_TEMPLATES[k].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex flex-col gap-1.5">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={NUDGE_MAX_CHARS} rows={5} aria-label="Lời nhắn" />
          <p className="flex justify-between gap-3 text-xs text-muted-foreground">
            <span>{'{ten}'} được thay bằng tên của từng học viên.</span>
            <span className="font-mono">
              {message.length}/{NUDGE_MAX_CHARS}
            </span>
          </p>
        </div>
        {first && (
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Xem trước gửi tới {first.name}</p>
            {personalize(message, first.name)}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={send} disabled={busy || !message.trim()}>
            {busy ? 'Đang gửi…' : 'Gửi lời nhắn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
