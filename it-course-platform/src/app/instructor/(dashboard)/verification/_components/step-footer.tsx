import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Chân màn: "Quay lại" bên trái, hành động chính bên phải, nền muted tách khỏi phần nhập.
export function StepFooter({ onBack, children }: { onBack?: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t bg-muted/50 px-5 py-4 sm:px-6">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          Quay lại
        </Button>
      ) : (
        <span />
      )}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">{children}</div>
    </div>
  );
}
