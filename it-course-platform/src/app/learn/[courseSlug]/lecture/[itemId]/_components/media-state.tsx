// …/_components/media-state.tsx
import type { LucideIcon } from 'lucide-react';

// Khối thay cho video/PDF khi chưa sẵn sàng / lỗi — giữ tỉ lệ 16:9 để trang không nhảy.
export function MediaState({ icon: Icon, title, text, children }: { icon: LucideIcon; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="flex aspect-video max-h-[calc(100dvh-10rem)] w-full flex-col items-center justify-center gap-3 bg-muted px-4 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <p className="font-semibold text-foreground">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}
