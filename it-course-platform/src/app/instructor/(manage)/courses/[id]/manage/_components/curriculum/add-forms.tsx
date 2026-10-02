'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addItem, addSection } from '@/lib/api/curriculum';
import { ITEM_TYPE_LABEL, type ItemType, MAX_TITLE } from '@/types/curriculum';
import { useCurriculum } from './curriculum-context';

// Thêm mục: chọn loại + tiêu đề, Enter thêm, Esc huỷ (như bản phác thảo).
export function AddItemForm({ sectionId }: { sectionId: string }) {
  const { courseId, locked, run } = useCurriculum();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ItemType>('lecture');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setBusy(true);
    const ok = await run(() => addItem(courseId, sectionId, type, value));
    setBusy(false);
    if (ok) {
      setTitle('');
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" disabled={locked} onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Mục trong chương trình
      </Button>
    );
  }
  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
      className="flex flex-col gap-2.5 rounded-lg border border-dashed bg-background p-3"
    >
      <div role="radiogroup" aria-label="Loại mục" className="flex flex-wrap gap-1.5">
        {(Object.keys(ITEM_TYPE_LABEL) as ItemType[]).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            role="radio"
            aria-checked={type === t}
            variant={type === t ? 'secondary' : 'outline'}
            onClick={() => setType(t)}
          >
            {ITEM_TYPE_LABEL[t]}
          </Button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          autoFocus
          value={title}
          maxLength={MAX_TITLE}
          placeholder={`Tiêu đề ${ITEM_TYPE_LABEL[type].toLowerCase()}`}
          aria-label="Tiêu đề mục"
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={!title.trim() || busy}>
            {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {busy ? 'Đang thêm…' : 'Thêm'}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setOpen(false)}>
            Huỷ
          </Button>
        </div>
      </div>
    </form>
  );
}

export function AddSectionForm() {
  const { courseId, locked, run } = useCurriculum();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setBusy(true);
    const ok = await run(() => addSection(courseId, value));
    setBusy(false);
    if (ok) {
      setTitle('');
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <div>
        <Button variant="outline" disabled={locked} onClick={() => setOpen(true)}>
          <Plus data-icon="inline-start" />
          Thêm phần
        </Button>
      </div>
    );
  }
  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
      className="flex flex-col gap-2 rounded-xl border border-dashed bg-card p-3 sm:flex-row sm:items-center"
    >
      <Input
        autoFocus
        value={title}
        maxLength={MAX_TITLE}
        placeholder="Tên phần, ví dụ: Cài đặt môi trường"
        aria-label="Tên phần mới"
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!title.trim() || busy}>
          {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {busy ? 'Đang thêm…' : 'Thêm phần'}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setOpen(false)}>
          Huỷ
        </Button>
      </div>
    </form>
  );
}
