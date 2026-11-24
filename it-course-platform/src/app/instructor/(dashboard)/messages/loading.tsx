import { MessagesSkeleton } from '@/components/messages/messages-skeleton';

// Nằm trong layout (đã có cột danh sách) → chỉ skeleton khung chat.
export default function Loading() {
  return <MessagesSkeleton part="thread" />;
}
