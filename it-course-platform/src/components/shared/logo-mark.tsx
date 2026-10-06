import { cn } from '@/lib/utils';

// Ký hiệu SkillPath: chữ S là một tuyến đường, ga xuất phát rỗng → ga đích đặc. Màu theo currentColor.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="56 24 144 208" aria-hidden className={cn('h-8 w-auto text-primary', className)}>
      <g fill="currentColor" fillRule="evenodd">
        <path d="M180.62 66.85A56 56 0 1 0 128 142A28 28 0 1 1 100 170L72 170A56 56 0 1 0 128 114A28 28 0 1 1 154.31 76.42Z" />
        <path d="M193 86A23 23 0 1 1 147 86A23 23 0 1 1 193 86ZM179 86A9 9 0 1 0 161 86A9 9 0 1 0 179 86Z" />
        <circle cx="86" cy="170" r="24" />
      </g>
    </svg>
  );
}
