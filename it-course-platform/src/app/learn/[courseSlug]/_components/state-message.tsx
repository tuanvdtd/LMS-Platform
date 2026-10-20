// it-course-platform/src/app/learn/[courseSlug]/_components/state-message.tsx
import type { LucideIcon } from 'lucide-react';

// Khối lỗi / trống trong khung học (cùng kiểu StateMessage của quiz/code).
export function StateMessage({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <Icon className="size-7 text-muted-foreground" aria-hidden />
      </div>
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground">{text}</p>
      {children && <div className="flex flex-wrap justify-center gap-2">{children}</div>}
    </main>
  );
}
