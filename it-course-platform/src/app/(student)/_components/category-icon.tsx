import { BrainCircuit, CodeXml, Folder, PenTool, Server, type LucideIcon } from 'lucide-react';

// Icon + tông màu của danh mục cấp 1 theo slug taxonomy (back-end seed). Slug mới chưa có → Folder, tông xanh.
// Tông chỉ để nhận ra lĩnh vực trong nháy mắt, không mang nghĩa trạng thái nên không dùng xanh lá/vàng/đỏ.
const CATEGORIES: Record<string, { icon: LucideIcon; tone: string }> = {
  'artificial-intelligence': { icon: BrainCircuit, tone: 'bg-tone-violet-soft text-tone-violet' },
  development: { icon: CodeXml, tone: 'bg-tone-blue-soft text-tone-blue' },
  'it-and-software': { icon: Server, tone: 'bg-tone-teal-soft text-tone-teal' },
  design: { icon: PenTool, tone: 'bg-tone-rose-soft text-tone-rose' },
};
const FALLBACK = { icon: Folder, tone: 'bg-tone-blue-soft text-tone-blue' };

export function categoryTone(slug: string) {
  return (CATEGORIES[slug] ?? FALLBACK).tone;
}

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = (CATEGORIES[slug] ?? FALLBACK).icon;
  return <Icon className={className} aria-hidden />;
}
