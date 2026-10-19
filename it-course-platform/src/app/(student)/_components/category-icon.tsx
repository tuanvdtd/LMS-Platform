import { BrainCircuit, CodeXml, Folder, PenTool, Server, type LucideIcon } from 'lucide-react';

// Icon danh mục cấp 1 theo slug taxonomy (back-end seed). Slug mới chưa có icon → Folder.
const ICONS: Record<string, LucideIcon> = {
  'artificial-intelligence': BrainCircuit,
  development: CodeXml,
  'it-and-software': Server,
  design: PenTool,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Folder;
  return <Icon className={className} aria-hidden />;
}
