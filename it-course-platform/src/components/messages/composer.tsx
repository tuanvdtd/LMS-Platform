'use client';
// src/components/messages/composer.tsx — Ô soạn tin: textarea tự giãn, Enter gửi, Shift+Enter xuống dòng; chọn/dán ảnh, tải lên R2 trước khi gửi.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ImagePlus, LoaderCircle, RotateCw, SendHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { requestImageUpload } from '@/lib/api/messages';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const MAX_LEN = 4000;
const MAX_HEIGHT = 144; // ~6 dòng
const MAX_IMAGES = 4;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type Pending = { id: number; file: File; preview: string; state: 'uploading' | 'done' | 'error'; key?: string };
// Ảnh gửi đi: quyền thu hồi `preview` chuyển cho nơi nhận (tin tạm).
export type SendImage = { key: string; preview: string };

export function Composer({ conversationId, onSend }: { conversationId: string; onSend: (body: string, images: SendImage[]) => void }) {
  const [value, setValue] = useState('');
  const [items, setItems] = useState<Pending[]>([]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const seq = useRef(0);
  const itemsRef = useRef<Pending[]>([]); // bản đồng bộ của items để đọc ngay trong handler
  const setAll = (next: Pending[]) => {
    itemsRef.current = next;
    setItems(next);
  };
  // Rời trang: thu hồi preview còn lại (ảnh đã gửi thì đã bị lấy khỏi danh sách).
  useEffect(() => () => itemsRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const patch = (id: number, p: Partial<Pending>) => setAll(itemsRef.current.map((x) => (x.id === id ? { ...x, ...p } : x)));

  async function upload(id: number, file: File) {
    patch(id, { state: 'uploading' });
    try {
      const { key, uploadUrl } = await requestImageUpload(conversationId, { mimeType: file.type, sizeBytes: file.size });
      // axios trần: không gửi cookie sang R2. Content-Length do trình duyệt đặt.
      await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });
      patch(id, { state: 'done', key });
    } catch (e) {
      patch(id, { state: 'error' });
      if (axios.isAxiosError(e) && e.response?.status === 429) toast.error('Bạn tải ảnh quá nhiều, thử lại sau ít phút');
    }
  }

  function addFiles(files: File[]) {
    if (!files.length) return;
    const okType = files.filter((f) => TYPES.includes(f.type));
    if (okType.length < files.length) toast.error('Chỉ nhận ảnh JPG, PNG hoặc WebP');
    const okSize = okType.filter((f) => f.size <= MAX_BYTES);
    if (okSize.length < okType.length) toast.error('Mỗi ảnh tối đa 5 MB');
    const room = Math.max(MAX_IMAGES - itemsRef.current.length, 0);
    if (okSize.length > room) toast.error(`Mỗi tin tối đa ${MAX_IMAGES} ảnh`);
    const added = okSize.slice(0, room).map((file) => ({ id: seq.current++, file, preview: URL.createObjectURL(file), state: 'uploading' as const }));
    if (!added.length) return;
    setAll([...itemsRef.current, ...added]);
    added.forEach((p) => void upload(p.id, p.file));
  }

  function removeItem(id: number) {
    const p = itemsRef.current.find((x) => x.id === id);
    if (p) URL.revokeObjectURL(p.preview);
    setAll(itemsRef.current.filter((x) => x.id !== id));
  }

  const text = value.trim();
  const tooLong = value.length > MAX_LEN;
  const uploading = items.some((p) => p.state === 'uploading');
  const failed = items.some((p) => p.state === 'error');
  const canSend = (text.length > 0 || items.length > 0) && !tooLong && !uploading && !failed;

  function submit() {
    if (!canSend) return;
    onSend(text, items.map((p) => ({ key: p.key!, preview: p.preview })));
    setAll([]);
    setValue('');
    ref.current?.focus();
  }

  return (
    <div className="border-t bg-card p-3">
      {items.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2" aria-label="Ảnh chờ gửi">
          {items.map((p, i) => (
            <li key={p.id} className="relative size-16" aria-busy={p.state === 'uploading'}>
              {/* eslint-disable-next-line @next/next/no-img-element -- blob URL cục bộ */}
              <img src={p.preview} alt={`Ảnh chờ gửi ${i + 1}`} className={cn('size-16 rounded-lg border object-cover', p.state !== 'done' && 'opacity-50')} />
              {p.state === 'uploading' && (
                <span className="absolute inset-0 flex items-center justify-center" role="status" aria-label="Đang tải ảnh lên">
                  <LoaderCircle className="size-5 animate-spin" />
                </span>
              )}
              {p.state === 'error' && (
                <Button variant="secondary" size="xs" className="absolute inset-x-1 bottom-1 h-6 px-1 text-xs" onClick={() => void upload(p.id, p.file)} aria-label={`Thử lại tải ảnh ${i + 1}`}>
                  <RotateCw data-icon="inline-start" />
                  Thử lại
                </Button>
              )}
              <Button variant="secondary" size="icon-xs" className="absolute -top-1.5 -right-1.5 size-5 rounded-full shadow" onClick={() => removeItem(p.id)} aria-label={`Bỏ ảnh ${i + 1}`}>
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {failed && <p className="mb-2 text-xs text-destructive">Có ảnh tải lên chưa được. Thử lại hoặc bỏ ảnh đó để gửi.</p>}
      <div className="flex items-end gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            addFiles([...(e.target.files ?? [])]);
            e.target.value = '';
          }}
        />
        <Button variant="ghost" size="icon-lg" className="size-11 shrink-0" onClick={() => fileInput.current?.click()} disabled={items.length >= MAX_IMAGES} aria-label="Thêm ảnh">
          <ImagePlus />
        </Button>
        <Textarea
          ref={ref}
          value={value}
          rows={1}
          onChange={(e) => setValue(e.target.value)}
          onPaste={(e) => {
            const imgs = [...e.clipboardData.files].filter((f) => f.type.startsWith('image/'));
            if (!imgs.length) return;
            if (!e.clipboardData.getData('text/plain')) e.preventDefault(); // có chữ kèm theo thì để chữ dán bình thường
            addFiles(imgs);
          }}
          onKeyDown={(e) => {
            // isComposing: đang gõ dấu tiếng Việt (Telex/VNI) thì Enter là chốt chữ, không phải gửi.
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Nhập tin nhắn…"
          aria-label="Nhập tin nhắn"
          aria-invalid={tooLong || undefined}
          className="min-h-11 resize-none overflow-y-auto py-2.5 leading-normal"
        />
        <Button size="icon-lg" className="size-11 shrink-0" disabled={!canSend} onClick={submit} aria-label="Gửi tin nhắn">
          <SendHorizontal />
        </Button>
      </div>
      {value.length >= 3500 && (
        <p className={cn('mt-1.5 text-right text-xs tabular-nums', tooLong ? 'font-medium text-destructive' : 'text-muted-foreground')}>
          {value.length}/{MAX_LEN}
          {tooLong && ' — quá dài, hãy rút gọn hoặc tách thành nhiều tin'}
        </p>
      )}
    </div>
  );
}
