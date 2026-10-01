'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FileUp, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { listLibrary } from '@/lib/api/assets';
import { uploadDocument, uploadErrorMessage } from '@/lib/upload';
import { cn } from '@/lib/utils';
import { formatBytes, type LibraryAsset, PDF_MAX_BYTES } from '@/types/curriculum';
import { useCurriculum } from './curriculum-context';

type Props = {
  onPick: (asset: LibraryAsset) => Promise<boolean>;
  onClose: () => void;
  // Đang tải: truyền hàm huỷ lên panel (dùng cho "Bỏ thay đổi" khi rời trang); xong / huỷ → null.
  onUploadingChange: (abort: (() => void) | null) => void;
};

// Ô chọn PDF (spec K7, §5.1): tab Tải lên / Thư viện. Thư viện mount khi mở lần đầu, sau đó giữ cả 2 (ẩn tab kia)
// để đổi tab không huỷ upload.
export function ContentPicker({ onPick, onClose, onUploadingChange }: Props) {
  const [tab, setTab] = useState<'upload' | 'library'>('upload');
  const [libraryOpened, setLibraryOpened] = useState(false);
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-3">
      <div className="flex items-center gap-1.5">
        {(['upload', 'library'] as const).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={tab === t ? 'secondary' : 'ghost'}
            aria-pressed={tab === t}
            onClick={() => {
              setTab(t);
              if (t === 'library') setLibraryOpened(true);
            }}
          >
            {t === 'upload' ? 'Tải lên' : 'Thư viện'}
          </Button>
        ))}
        <div className="flex-1" />
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Đóng ô chọn file" onClick={onClose}>
          <X />
        </Button>
      </div>
      <div hidden={tab !== 'upload'}>
        <UploadTab onPick={onPick} onUploadingChange={onUploadingChange} />
      </div>
      {libraryOpened && (
        <div hidden={tab !== 'library'}>
          <LibraryTab onPick={onPick} />
        </div>
      )}
    </div>
  );
}

function UploadTab({ onPick, onUploadingChange }: Omit<Props, 'onClose'>) {
  const { locked } = useCurriculum();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedFile, setFailedFile] = useState<File | null>(null); // file PUT lỗi → nút "Thử lại" (spec §6)
  const [over, setOver] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);
  // Đóng ô chọn / thu gọn bài giảng / rời trang khi đang tải → huỷ PUT (spec §6).
  useEffect(() => () => ctrlRef.current?.abort(), []);

  async function start(file: File | undefined) {
    if (!file || ctrlRef.current || locked) return;
    setError(null);
    setFailedFile(null);
    if (file.type !== 'application/pdf') return setError('Chỉ nhận file PDF');
    if (file.size > PDF_MAX_BYTES) return setError('PDF tối đa 1 GB');
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    onUploadingChange(() => ctrl.abort());
    setProgress(0);
    try {
      const asset = await uploadDocument(file, { signal: ctrl.signal, onProgress: setProgress });
      if (!ctrl.signal.aborted) await onPick(asset);
    } catch (err) {
      const message = uploadErrorMessage(err);
      setError(message);
      // 400 = BE từ chối chính file này → thử lại cũng vô ích.
      if (message && !(axios.isAxiosError(err) && err.response?.status === 400)) setFailedFile(file);
    } finally {
      ctrlRef.current = null;
      setProgress(null);
      onUploadingChange(null);
    }
  }

  if (progress !== null) {
    return (
      <div className="flex items-center gap-3">
        <Progress value={progress} className="flex-1" aria-label="Tiến độ tải lên" />
        <span className="w-10 text-right text-xs tabular-nums">{progress}%</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => ctrlRef.current?.abort()}>
          Huỷ
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void start(e.dataTransfer.files[0]);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-[1.5px] border-dashed bg-background px-4 py-6 text-center text-sm has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
          over && 'border-primary bg-primary/5',
        )}
      >
        <FileUp className="size-5 text-muted-foreground" />
        <span className="font-semibold">Chọn file PDF hoặc kéo thả vào đây</span>
        <span className="text-xs text-muted-foreground">Tối đa 1 GB</span>
        <input
          type="file"
          accept="application/pdf"
          disabled={locked}
          className="sr-only"
          onChange={(e) => {
            void start(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
      {error && (
        <div className="flex items-center gap-2">
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          {failedFile && (
            <Button type="button" variant="outline" size="xs" disabled={locked} onClick={() => void start(failedFile)}>
              Thử lại
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function LibraryTab({ onPick }: Pick<Props, 'onPick'>) {
  const { locked } = useCurriculum();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<LibraryAsset[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);

  // Tìm debounce 300ms, huỷ request cũ khi gõ tiếp.
  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      listLibrary(q.trim(), ctrl.signal).then(
        (list) => {
          setItems(list);
          setFailed(false);
        },
        (err: unknown) => {
          if (!axios.isCancel(err)) setFailed(true);
        },
      );
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  async function choose(asset: LibraryAsset) {
    setPicking(asset.id);
    await onPick(asset);
    setPicking(null);
  }

  let body: React.ReactNode;
  if (failed) body = <p className="text-sm text-destructive">Không tải được thư viện.</p>;
  else if (items === null) body = <p className="text-sm text-muted-foreground">Đang tải…</p>;
  else if (items.length === 0) {
    body = (
      <p className="text-sm text-muted-foreground">
        {q.trim() ? 'Không có file khớp.' : 'Thư viện trống. Hãy tải file lên.'}
      </p>
    );
  } else {
    body = (
      <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto">
        {items.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              disabled={picking !== null || locked}
              onClick={() => void choose(a)}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              <span className="min-w-0 flex-1 truncate">{a.fileName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatBytes(a.sizeBytes)} · {new Date(a.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          maxLength={100}
          placeholder="Tìm theo tên file"
          aria-label="Tìm trong thư viện"
          className="pl-8"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {body}
    </div>
  );
}
