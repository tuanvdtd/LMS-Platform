'use client';

import { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { saveAvatar } from '@/lib/api/instructor-application';
import { authClient } from '@/lib/auth-client';
import { uploadAvatar, uploadErrorMessage } from '@/lib/upload';
import { cn } from '@/lib/utils';
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from '@/types/instructor-application';
import { handleStepError, type StepProps } from './step-shared';

// Bước 2: ảnh hồ sơ. Chọn file là tải + lưu luôn (ghi vào tài khoản), không có nút Lưu riêng.
export function AvatarStep({ view, onSaved }: StepProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refetch } = authClient.useSession();

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) return setError('Chỉ nhận ảnh JPG, PNG hoặc WebP');
    if (file.size > AVATAR_MAX_BYTES) return setError('Ảnh tối đa 5 MB');
    setBusy(true);
    setError(null);
    try {
      const v = await saveAvatar(await uploadAvatar(file));
      void refetch(); // avatar mới lên header
      toast.success('Đã lưu ảnh hồ sơ');
      onSaved(v);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 409) handleStepError(e, () => undefined);
      else setError(uploadErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p id="avatar-hint" className="text-sm text-muted-foreground">
        Ảnh rõ mặt, nền gọn gàng, tối thiểu 200×200 px, tối đa 5 MB (JPG, PNG, WebP). Ảnh hiển thị dạng tròn trên trang
        giảng viên.
      </p>
      <div className="flex items-center gap-5">
        {view.image ? (
          <Image
            src={view.image}
            alt="Ảnh hồ sơ"
            width={96}
            height={96}
            unoptimized
            className="size-24 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-10 text-muted-foreground" aria-hidden />
          </div>
        )}
        {/* Input ẩn nằm trong label nên vòng focus phải vẽ lên label */}
        <label
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'cursor-pointer has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
            busy && 'pointer-events-none opacity-50',
          )}
        >
          <input
            type="file"
            accept={AVATAR_TYPES.join(',')}
            className="sr-only"
            disabled={busy}
            aria-describedby="avatar-hint"
            onChange={(e) => {
              void pick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {busy ? 'Đang tải lên…' : view.image ? 'Đổi ảnh' : 'Chọn ảnh'}
        </label>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {view.image && (
        <div>
          <Button onClick={() => onSaved(view)} disabled={busy}>
            Tiếp tục
          </Button>
        </div>
      )}
    </div>
  );
}
