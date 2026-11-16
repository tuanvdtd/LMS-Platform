import { cn } from '@/lib/utils';

// Ký hiệu Aolumi: chữ "a" thường đồng thời là bong bóng lời nói (đuôi nhọn ở góc dưới trái). Màu theo currentColor.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="38 46 176 160" aria-hidden className={cn('h-8 w-auto text-primary', className)}>
      <g fill="currentColor">
        <path
          fillRule="evenodd"
          d="M118 46A80 80 0 0 1 198 126A80 80 0 0 1 118 206H38L61.43 182.57A80 80 0 0 1 118 46ZM118 90A36 36 0 1 0 118 162A36 36 0 1 0 118 90Z"
        />
        <rect x="170" y="46" width="44" height="160" rx="22" />
      </g>
    </svg>
  );
}
