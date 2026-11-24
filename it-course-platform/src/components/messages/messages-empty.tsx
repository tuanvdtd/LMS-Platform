// src/components/messages/messages-empty.tsx — Trạng thái trống: chưa chọn cuộc / chưa có cuộc nào.
import { MessageSquareText } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export function MessagesEmpty({ variant = 'select' }: { variant?: 'select' | 'none' }) {
  return (
    <Empty className="border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-12 rounded-xl bg-primary-soft text-primary [&_svg:not([class*='size-'])]:size-6">
          <MessageSquareText />
        </EmptyMedia>
        <EmptyTitle className="text-base">{variant === 'select' ? 'Chọn một cuộc trò chuyện' : 'Chưa có cuộc trò chuyện nào'}</EmptyTitle>
        <EmptyDescription>
          {variant === 'select'
            ? 'Chọn một người ở danh sách bên trái để xem và gửi tin nhắn.'
            : 'Bấm “Nhắn tin” ở trang giảng viên hoặc học viên để bắt đầu trao đổi về khoá học.'}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
