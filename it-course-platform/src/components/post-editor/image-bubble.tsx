'use client';

import { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Captions, Check, ScanText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

type Field = 'title' | 'alt';

const FIELDS: Record<Field, { label: string; placeholder: string }> = {
  title: { label: 'Chú thích', placeholder: 'Chú thích hiện dưới ảnh' },
  alt: { label: 'Mô tả ảnh', placeholder: 'Mô tả cho người dùng trình đọc màn hình' },
};

// Thanh nhỏ ngay trên ảnh đang chọn: chú thích, mô tả ảnh, xoá ảnh. Ô nhập nằm luôn trong thanh
// (không dùng popover: popover nằm ngoài thanh, mở ra là trình soạn mất focus và thanh tự ẩn).
export function ImageBubble({ editor }: { editor: Editor }) {
  const [editing, setEditing] = useState<Field | null>(null);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function open(field: Field) {
    setValue((editor.getAttributes('image')[field] as string | null) ?? '');
    setEditing(field);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function apply() {
    if (!editing) return;
    const v = value.trim();
    editor.chain().focus().updateAttributes('image', { [editing]: editing === 'title' ? v || null : v }).run();
    setEditing(null);
  }

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="imageBubble"
      shouldShow={({ editor: e }) => e.isActive('image')}
      // Phía trên ảnh bị header + thanh trên + thanh công cụ dính che (~170px) → lật xuống dưới ảnh.
      options={{ placement: 'top', offset: 8, flip: { padding: { top: 170 } }, shift: { padding: 8 }, onHide: () => setEditing(null) }}
      className="z-20 flex items-center gap-1 rounded-lg border bg-popover p-1 shadow-lg"
    >
      {editing ? (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <Input
            ref={inputRef}
            value={value}
            maxLength={200}
            placeholder={FIELDS[editing].placeholder}
            aria-label={FIELDS[editing].label}
            className="h-8 w-72"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setEditing(null);
                editor.commands.focus();
              }
            }}
          />
          <Button type="submit" size="sm">
            <Check data-icon="inline-start" />
            Lưu
          </Button>
        </form>
      ) : (
        <>
          <Button variant="ghost" size="sm" onClick={() => open('title')}>
            <Captions data-icon="inline-start" />
            Chú thích
          </Button>
          <Button variant="ghost" size="sm" onClick={() => open('alt')}>
            <ScanText data-icon="inline-start" />
            Mô tả ảnh
          </Button>
          <Separator orientation="vertical" className="mx-0.5 h-5 data-vertical:self-center" />
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => editor.chain().focus().deleteSelection().run()}
          >
            <Trash2 data-icon="inline-start" />
            Xoá ảnh
          </Button>
        </>
      )}
    </BubbleMenu>
  );
}
