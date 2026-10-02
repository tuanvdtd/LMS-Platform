'use client';

import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MAX_TITLE } from '@/types/curriculum';

// Sửa tên tại chỗ (spec §5.2): Enter / rời ô → lưu nếu khác; rỗng → trả tên cũ; Esc → trả tên cũ.
export function InlineTitle({
  value,
  label,
  disabled,
  className,
  onSave,
}: {
  value: string;
  label: string;
  disabled?: boolean;
  className?: string;
  onSave: (title: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  const [failed, setFailed] = useState(false);
  const saving = useRef(false); // blur lần 2 khi PATCH chưa xong → không gửi trùng
  // Tên mới từ server (lưu xong / tải lại cây) → cập nhật ô (adjust state khi prop đổi, không dùng effect).
  if (synced !== value) {
    setSynced(value);
    setDraft(value);
  }

  async function commit() {
    const title = draft.trim();
    if (!title || title === value) {
      setDraft(value);
      setFailed(false);
      return;
    }
    if (saving.current) return;
    saving.current = true;
    try {
      setFailed(!(await onSave(title)));
    } finally {
      saving.current = false;
    }
  }

  return (
    <div className={cn('flex min-w-0 flex-1 flex-col', className)}>
      <Input
        value={draft}
        aria-label={label}
        maxLength={MAX_TITLE}
        disabled={disabled}
        aria-invalid={failed || undefined}
        className="h-8 border-transparent bg-transparent px-2 font-medium shadow-none hover:border-input dark:bg-transparent"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            setDraft(value);
            setFailed(false);
          }
        }}
      />
      {failed && <p className="px-2 text-xs text-destructive">Chưa lưu được tên, sửa rồi thử lại</p>}
    </div>
  );
}
