// …/_components/lecture-notes.tsx
'use client';

import { type RefObject, useEffect, useId, useState } from 'react';
import { Pencil, StickyNote, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { apiMessage } from '@/lib/api/checkout';
import { createNote, deleteNote, listNotes, updateNote } from '@/lib/api/learn';
import { formatDuration } from '@/types/curriculum';
import { NOTE_MAX, type Note } from '@/types/learn';

const sortNotes = (list: Note[]) =>
  [...list].sort((a, b) => a.positionSec - b.positionSec || a.createdAt.localeCompare(b.createdAt));

// Ghi chú riêng gắn mốc video. videoRef null = bài PDF (không có mốc).
export function LectureNotes({
  courseSlug,
  itemId,
  videoRef,
}: {
  courseSlug: string;
  itemId: string;
  videoRef: RefObject<HTMLVideoElement | null> | null;
}) {
  const inputId = useId();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [mark, setMark] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);

  useEffect(() => {
    let cancelled = false;
    listNotes(courseSlug, itemId).then(
      (l) => { if (!cancelled) setNotes(l); },
      (e) => { if (!cancelled) setLoadError(apiMessage(e, 'Không tải được ghi chú')); },
    );
    return () => { cancelled = true; };
  }, [courseSlug, itemId]);

  const currentSec = () => Math.floor(videoRef?.current?.currentTime ?? 0);

  async function add() {
    const body = draft.trim();
    if (!body || saving) return;
    setSaving(true);
    try {
      const note = await createNote(courseSlug, itemId, { positionSec: videoRef ? mark : 0, body });
      setNotes((l) => sortNotes([...(l ?? []), note]));
      setDraft('');
      // Ô nhập vẫn focus nên mốc không tự cập nhật → lấy lại mốc hiện tại cho ghi chú kế tiếp.
      setMark(currentSec());
    } catch (e) {
      toast.error(apiMessage(e, 'Không lưu được ghi chú'));
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const body = editing.body.trim();
    if (!body) return;
    setSaving(true);
    try {
      const note = await updateNote(courseSlug, editing.id, body);
      setNotes((l) => l && l.map((n) => (n.id === note.id ? note : n)));
      setEditing(null);
    } catch (e) {
      toast.error(apiMessage(e, 'Không sửa được ghi chú'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    try {
      await deleteNote(courseSlug, target.id);
      setNotes((l) => l && l.filter((n) => n.id !== target.id));
    } catch (e) {
      toast.error(apiMessage(e, 'Không xoá được ghi chú'));
    }
  }

  function jump(sec: number) {
    const v = videoRef?.current;
    if (!v) return;
    // ref của phần tử DOM do VideoPlayer sở hữu, ghi ở event handler là hợp lệ; rule không phân biệt được.
    // eslint-disable-next-line react-hooks/immutability
    v.currentTime = sec;
    v.play().catch(() => {});
    v.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  return (
    <div className="space-y-5">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <Label htmlFor={inputId}>Thêm ghi chú{videoRef ? ` tại ${formatDuration(mark)}` : ''}</Label>
        <Textarea
          id={inputId}
          value={draft}
          maxLength={NOTE_MAX}
          rows={3}
          placeholder="Điều bạn muốn nhớ ở đoạn này…"
          onFocus={() => setMark(currentSec())}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void add();
            }
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {draft.length}/{NOTE_MAX} · Ctrl+Enter để lưu
          </span>
          <Button type="submit" className="h-11" disabled={saving || !draft.trim()}>
            Lưu ghi chú
          </Button>
        </div>
      </form>

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : !notes ? (
        <div className="space-y-2" role="status" aria-busy="true" aria-label="Đang tải ghi chú">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <StickyNote className="size-6" aria-hidden />
          <p className="text-sm">Chưa có ghi chú nào cho bài này.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl border bg-card p-3">
              <div className="flex items-start gap-3">
                {videoRef && (
                  <button
                    type="button"
                    onClick={() => jump(n.positionSec)}
                    className="inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-md bg-[var(--primary-light)] px-2 font-mono text-xs font-semibold text-primary tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-label={`Tua tới ${formatDuration(n.positionSec)}`}
                  >
                    {formatDuration(n.positionSec)}
                  </button>
                )}
                {editing?.id === n.id ? (
                  <div className="min-w-0 flex-1 space-y-2">
                    <Textarea
                      value={editing.body}
                      maxLength={NOTE_MAX}
                      rows={3}
                      aria-label="Sửa ghi chú"
                      onChange={(e) => setEditing({ id: n.id, body: e.target.value })}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" className="h-11" onClick={() => setEditing(null)}>Huỷ</Button>
                      <Button className="h-11" disabled={saving || !editing.body.trim()} onClick={() => void saveEdit()}>Lưu</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="min-w-0 flex-1 text-sm whitespace-pre-wrap text-foreground">{n.body}</p>
                    <div className="flex shrink-0">
                      <Button variant="ghost" size="icon" className="size-11" aria-label="Sửa ghi chú" onClick={() => setEditing({ id: n.id, body: n.body })}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-11" aria-label="Xoá ghi chú" onClick={() => setDeleting(n)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá ghi chú này?</AlertDialogTitle>
            <AlertDialogDescription>Ghi chú bị xoá không khôi phục được.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <Button variant="destructive" onClick={() => void confirmDelete()}>Xoá</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
