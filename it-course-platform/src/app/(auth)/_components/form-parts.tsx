import { Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function Banner({ tone = 'error', children }: { tone?: 'error' | 'success'; children: React.ReactNode }) {
  const color = tone === 'error' ? 'var(--destructive)' : 'var(--success, #16a34a)';
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className="rounded-lg border px-3 py-2 text-sm"
      style={{ color, borderColor: color, background: `color-mix(in srgb, ${color} 8%, transparent)` }}
    >
      {children}
    </div>
  );
}

export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onToggle}
      // Căn giữa bằng inset + my-auto, không dùng -translate-y-1/2: Button đặt translate-y 1px khi nhấn,
      // đè mất -50% làm nút nhảy xuống nửa chiều cao rồi bật lên.
      className="absolute inset-y-0 right-0 my-auto"
      aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
    >
      {shown ? <EyeOff size={15} style={{ color: 'var(--muted-foreground)' }} /> : <Eye size={15} style={{ color: 'var(--muted-foreground)' }} />}
    </Button>
  );
}

export function AuthSteps({ steps, done = 0 }: { steps: string[]; done?: number }) {
  return (
    <ol className="mt-8 space-y-3 border-t pt-6">
      {steps.map((step, i) => (
        <li key={step} className="flex items-start gap-3 text-sm">
          <span
            className={
              i < done
                ? 'grid size-6 shrink-0 place-items-center rounded-full bg-success-soft text-success'
                : 'grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground'
            }
          >
            {i < done ? <Check className="size-3.5" aria-label="Đã xong" /> : i + 1}
          </span>
          <span className={i < done ? 'pt-0.5 text-muted-foreground' : 'pt-0.5 text-foreground'}>{step}</span>
        </li>
      ))}
    </ol>
  );
}
