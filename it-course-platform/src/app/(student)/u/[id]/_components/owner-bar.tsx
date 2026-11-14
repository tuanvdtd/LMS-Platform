'use client';

import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

// Chỉ chủ hồ sơ thấy: nhắc đây là trang công khai của mình và phần học tập đang hiện hay ẩn.
// Trang được cache theo id cho mọi người xem nên phần "của tôi" phải tách ra client.
export function OwnerBar({ id, learningPublic }: { id: string; learningPublic: boolean }) {
  const { data } = authClient.useSession();
  if (data?.user.id !== id) return null;
  const State = learningPublic ? Eye : EyeOff;

  return (
    <div className="border-b bg-muted">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 text-sm">
        <p className="flex items-center gap-2 text-foreground">
          <State className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            Đây là trang cá nhân của bạn.{' '}
            <span className="text-muted-foreground">
              {learningPublic ? 'Phần học tập đang công khai.' : 'Phần học tập đang riêng tư, người khác không thấy.'}
            </span>
          </span>
        </p>
        <Link href="/settings" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Chỉnh sửa hồ sơ
        </Link>
      </div>
    </div>
  );
}
