'use client';
// src/components/messages/message-button.tsx — Nút "Nhắn tin": mở (hoặc tạo) cuộc trò chuyện rồi chuyển tới khung chat.

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { getPeer, openConversation } from '@/lib/api/messages';
import { conversationHref } from '@/lib/messages';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Props = {
  userId: string;
  basePath?: string;
  canMessage?: boolean;
  label?: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
  size?: React.ComponentProps<typeof Button>['size'];
  className?: string;
};

export function MessageButton({ userId, basePath = '/messages', canMessage, label = 'Nhắn tin', variant = 'outline', size = 'sm', className }: Props) {
  const router = useRouter();
  const me = authClient.useSession().data?.user.id;
  const [fetched, setFetched] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const allowed = canMessage ?? fetched;

  useEffect(() => {
    if (!me || me === userId || canMessage !== undefined) return;
    let live = true;
    getPeer(userId)
      .then((r) => live && setFetched(r.canMessage))
      .catch(() => live && setFetched(false));
    return () => {
      live = false;
    };
  }, [me, userId, canMessage]);

  if (!me || me === userId || !allowed) return null;

  const open = async () => {
    setBusy(true);
    try {
      router.push(conversationHref(basePath, await openConversation(userId)));
    } catch (e) {
      toast.error((axios.isAxiosError(e) && (e.response?.data as { message?: string } | undefined)?.message) || 'Không mở được cuộc trò chuyện.');
      setBusy(false);
    }
  };

  return (
    <Button variant={variant} size={size} disabled={busy} onClick={open} className={cn('h-11 sm:h-8', className)}>
      <MessageCircle data-icon="inline-start" />
      {label}
    </Button>
  );
}
