import Image from 'next/image';
import Link from 'next/link';
import { Star, TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, Clock, AlertCircle, Loader2, Info } from 'lucide-react';
import type { Course, CourseStatus, RecommendedCourse, SkillMastery, Verdict } from '@/types';
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
          className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
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
export function SkillMasteryBar({ skill }: { skill: SkillMastery }) {
  const color =
    skill.mastery < 40 ? 'var(--skill-weak)' : skill.mastery < 70 ? 'var(--skill-mid)' : 'var(--skill-strong)';
  const label = skill.mastery < 40 ? 'Yếu' : skill.mastery < 70 ? 'Trung bình' : 'Vững';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
            {skill.skillName}
          </span>
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {skill.trend === 'up' && <TrendingUp size={12} className="text-green-500" />}
            {skill.trend === 'down' && <TrendingDown size={12} className="text-red-500" />}
            {skill.trend === 'stable' && <Minus size={12} style={{ color: 'var(--muted-foreground)' }} />}
            <span className="text-xs font-mono font-bold" style={{ color }}>
              {skill.mastery}%
            </span>
            <span className="text-xs" style={{ color }}>
              {label}
            </span>
          </div>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--secondary)' }}
          role="progressbar"
          aria-valuenow={skill.mastery}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${skill.mastery}%`, background: color }}
          />
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
  draft: { label: 'Nháp', color: 'var(--status-draft)', bg: '#f1f5f9' },
  pending: { label: 'Chờ duyệt', color: '#854d0e', bg: '#fef9c3' },
  approved: { label: 'Đang bán', color: '#166534', bg: '#dcfce7' },
  rejected: { label: 'Bị từ chối', color: 'var(--status-rejected)', bg: '#fee2e2' },
  hidden: { label: 'Đã ẩn', color: 'var(--status-hidden)', bg: '#f1f5f9' },
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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--secondary)' }}
      >
        <Icon size={28} className="opacity-50" />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mb-4 max-w-xs" style={{ color: 'var(--muted-foreground)' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// ─── CourseCard ───────────────────────────────────────────────────────────────

export function CourseCard({ course, progress }: { course: Course; progress?: number }) {
  return (
    <Link
      href={`/course/${course.slug}`}
      className="group block rounded-xl overflow-hidden border hover:shadow-lg transition-all duration-200"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'var(--secondary)' }}>
            <div className="h-full" style={{ width: `${progress}%`, background: 'var(--primary)' }} />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3
          className="font-semibold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors"
          style={{ color: 'var(--foreground)' }}
        >
          {course.title}
        </h3>
        <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
          {course.instructor.name}
        </p>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs font-bold text-amber-500">{course.rating}</span>
          <RatingStars rating={course.rating} size="sm" />
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            ({course.ratingCount.toLocaleString()})
          </span>
        </div>
        <PriceTag price={course.price} originalPrice={course.originalPrice} size="sm" />
        {progress !== undefined && (
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {progress}% hoàn thành
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── RecommendationCard ───────────────────────────────────────────────────────

export function RecommendationCard({ course }: { course: RecommendedCourse }) {
  return (
    <Link
      href={`/course/${course.slug}`}
      className="group block rounded-xl overflow-hidden border hover:shadow-lg transition-all duration-200"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="relative aspect-video bg-slate-100">
        <Image src={course.thumbnail} alt={course.title} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <div
          className="flex items-start gap-1.5 text-xs font-semibold mb-2 px-2 py-1 rounded-lg"
          style={{
            background: course.reason.type === 'skill_gap' ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--primary-light)',
            color: course.reason.type === 'skill_gap' ? 'var(--accent)' : 'var(--primary)',
          }}
        >
          <Info size={12} className="mt-0.5 shrink-0" />
          <span>{course.reason.detail}</span>
        </div>
        <h3
          className="font-semibold text-sm leading-snug mb-1 line-clamp-2"
          style={{ color: 'var(--foreground)' }}
        >
          {course.title}
        </h3>
        <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
          {course.instructor.name}
        </p>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs font-bold text-amber-500">{course.rating}</span>
          <RatingStars rating={course.rating} />
        </div>
        <PriceTag price={course.price} originalPrice={course.originalPrice} size="sm" />
      </div>
    </Link>
  );
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
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
      variant={variants[variant]}
      size={sizes[size]}
      className={className}
    >
      {children}
    </Button>
  );
}
