import { Eye, EyeOff } from 'lucide-react';
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
      className="absolute right-0 top-1/2 -translate-y-1/2"
      aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
    >
      {shown ? <EyeOff size={15} style={{ color: 'var(--muted-foreground)' }} /> : <Eye size={15} style={{ color: 'var(--muted-foreground)' }} />}
    </Button>
  );
}
