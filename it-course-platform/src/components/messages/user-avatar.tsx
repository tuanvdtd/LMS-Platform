// src/components/messages/user-avatar.tsx — Avatar người dùng trong tin nhắn (ảnh, fallback chữ cái đầu).
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { MessageUser } from '@/types/message';

export function UserAvatar({ user, size, className }: { user: MessageUser; size?: 'sm' | 'default' | 'lg'; className?: string }) {
  return (
    <Avatar size={size} className={className}>
      {user.image && <AvatarImage src={user.image} alt="" />}
      <AvatarFallback>{user.name.trim().charAt(0).toUpperCase() || '?'}</AvatarFallback>
    </Avatar>
  );
}
