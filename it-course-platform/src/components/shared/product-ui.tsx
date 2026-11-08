import { Star, TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import type { CourseStatus, Verdict } from '@/types';
import { MASTERY_COLOR, MASTERY_LABEL, masteryLevel } from '@/lib/skills';
import { Button } from '@/components/ui/button';

// ─── RatingStars ──────────────────────────────────────────────────────────────
export function RatingStars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const stars = [1, 2, 3, 4, 5];
  const s = size === 'sm' ? 12 : 16;
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} sao`}>
      {stars.map((i) => (
        <Star
          key={i}
          size={s}
          className={i <= Math.round(rating) ? 'fill-rating text-rating' : 'text-border'}
        />
      ))}
    </span>
  );
}

// ─── PriceTag ─────────────────────────────────────────────────────────────────
export function PriceTag({
  price,
  originalPrice,
  size = 'md',
}: {
  price: number;
  originalPrice: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
  const priceClass =
    size === 'lg'
      ? 'text-2xl font-bold'
      : size === 'sm'
        ? 'text-sm font-semibold'
        : 'text-lg font-bold';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={priceClass} style={{ color: 'var(--accent)' }}>
        {fmt(price)}
      </span>
      {discount > 0 && (
        <>
          <span className="text-sm line-through" style={{ color: 'var(--muted-foreground)' }}>
            {fmt(originalPrice)}
          </span>
          <span
            className="text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
          >
            -{discount}%
          </span>
        </>
      )}
    </div>
  );
}

// ─── SkillTag ─────────────────────────────────────────────────────────────────
export function SkillTagBadge({ name, mastery }: { name: string; mastery?: number }) {
  const color =
    mastery === undefined
      ? { bg: 'var(--secondary)', text: 'var(--secondary-foreground)' }
      : mastery < 40
        ? { bg: 'var(--skill-weak-bg)', text: 'var(--skill-weak)' }
        : mastery < 70
          ? { bg: 'var(--skill-mid-bg)', text: 'var(--skill-mid)' }
          : { bg: 'var(--skill-strong-bg)', text: 'var(--skill-strong)' };

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border"
      style={{ background: color.bg, color: color.text, borderColor: color.text + '33' }}
    >
      {name}
      {mastery !== undefined && <span className="font-mono font-bold">{mastery}%</span>}
    </span>
  );
}

// ─── SkillMasteryBar ──────────────────────────────────────────────────────────
export function SkillMasteryBar({ name, pct, trend }: { name: string; pct: number; trend?: 'up' | 'down' | 'stable' }) {
  const level = masteryLevel(pct);
  const color = MASTERY_COLOR[level];

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium truncate text-foreground">{name}</span>
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {trend === 'up' && <TrendingUp size={12} className="text-success" aria-hidden />}
            {trend === 'down' && <TrendingDown size={12} className="text-danger" aria-hidden />}
            {trend === 'stable' && <Minus size={12} className="text-muted-foreground" aria-hidden />}
            <span className="text-xs font-mono font-bold text-foreground">{pct}%</span>
            <span className="text-xs text-foreground">{MASTERY_LABEL[level]}</span>
          </div>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden bg-secondary"
          role="meter"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={name}
        >
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

// ─── ProgressRing ─────────────────────────────────────────────────────────────
export function ProgressRing({ progress, size = 40 }: { progress: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${progress}% hoàn thành`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--secondary)" strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize={size * 0.2} fontWeight={700} fill="var(--foreground)">
        {progress}%
      </text>
    </svg>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
const STATUS_MAP: Record<CourseStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Nháp', color: 'var(--secondary-foreground)', bg: 'var(--secondary)' },
  pending: { label: 'Chờ duyệt', color: 'var(--warning)', bg: 'var(--warning-soft)' },
  approved: { label: 'Đang bán', color: 'var(--success)', bg: 'var(--success-soft)' },
  rejected: { label: 'Bị từ chối', color: 'var(--danger)', bg: 'var(--danger-soft)' },
  hidden: { label: 'Đã ẩn', color: 'var(--status-hidden)', bg: 'var(--secondary)' },
};

export function StatusBadge({ status }: { status: CourseStatus }) {
  const s = STATUS_MAP[status];
  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

// ─── VerdictBadge ─────────────────────────────────────────────────────────────
const VERDICT_MAP: Record<Verdict, { label: string; color: string; icon: typeof CheckCircle }> = {
  AC: { label: 'Accepted', color: 'var(--verdict-ac)', icon: CheckCircle },
  WA: { label: 'Wrong Answer', color: 'var(--verdict-wa)', icon: XCircle },
  TLE: { label: 'Time Limit', color: 'var(--verdict-tle)', icon: Clock },
  RE: { label: 'Runtime Error', color: 'var(--verdict-re)', icon: AlertCircle },
  CE: { label: 'Compile Error', color: 'var(--verdict-ce)', icon: AlertCircle },
  IE: { label: 'Lỗi hệ thống', color: 'var(--muted-foreground)', icon: AlertCircle },
  Pending: { label: 'Đang chờ', color: 'var(--verdict-pending)', icon: Loader2 },
  Running: { label: 'Đang chạy', color: 'var(--verdict-pending)', icon: Loader2 },
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const v = VERDICT_MAP[verdict];
  const Icon = v.icon;
  const spin = verdict === 'Pending' || verdict === 'Running';

  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: v.color }}>
      <Icon size={14} className={spin ? 'animate-spin' : ''} />
      {v.label}
    </span>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  change,
  sub,
}: {
  label: string;
  value: string | number;
  change?: number;
  sub?: string;
}) {
  const pos = change !== undefined && change >= 0;
  return (
    <div
      className="rounded-xl p-5 border"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
        {value}
      </p>
      <div className="flex items-center gap-2">
        {change !== undefined && (
          <span
            className="text-xs font-semibold flex items-center gap-0.5"
            style={{ color: pos ? 'var(--skill-strong)' : 'var(--skill-weak)' }}
          >
            {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change)}% so với kỳ trước
          </span>
        )}
        {sub && (
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-14 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary">
        <Icon size={22} className="text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  isLoading,
  locked,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  locked?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const variants = {
    primary: 'default',
    secondary: 'outline',
    accent: 'accent',
    ghost: 'ghost',
    danger: 'destructive',
  } as const;
  const sizes = { sm: 'sm', md: 'default', lg: 'lg' } as const;

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      isLoading={isLoading}
      locked={locked}
      variant={variants[variant]}
      size={sizes[size]}
      className={className}
    >
      {children}
    </Button>
  );
}
