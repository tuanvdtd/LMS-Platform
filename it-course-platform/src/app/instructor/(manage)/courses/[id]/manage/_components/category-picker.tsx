'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CategoryNode } from '@/types';

const labels = (list: { id: string; name: string }[]) => Object.fromEntries(list.map((x) => [x.id, x.name]));

// Cây nhận qua props từ trang server (getCategoryTree có cache), không gọi axios (spec §5.2).
// Khoá chỉ gắn vào thể loại con → value là id cấp 2; cấp 1 là state cục bộ.
export function CategoryPicker({
  categories,
  value,
  onChange,
  invalid,
}: {
  categories: CategoryNode[];
  value: string | null;
  onChange: (id: string | null) => void;
  invalid?: boolean;
}) {
  // Cấp 1 suy từ value để reset() của form kéo được cả ô cấp 1; chỉ dùng state khi chưa chọn cấp 2.
  const [picked, setPicked] = useState<string | null>(null);
  const parentId = categories.find((c) => c.children.some((s) => s.id === value))?.id ?? picked;

  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">Không tải được danh mục, thử tải lại trang.</p>;
  }
  const children = categories.find((c) => c.id === parentId)?.children ?? [];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Select
        items={labels(categories)}
        value={parentId}
        onValueChange={(id) => {
          setPicked(id);
          onChange(null);
        }}
      >
        <SelectTrigger id="category-l1" className="w-full" aria-label="Thể loại">
          <SelectValue placeholder="Chọn thể loại" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select items={labels(children)} value={value} onValueChange={(id) => onChange(id)} disabled={!parentId}>
        <SelectTrigger id="category-l2" className="w-full" aria-label="Thể loại con" aria-invalid={invalid}>
          <SelectValue placeholder="Chọn thể loại con" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {children.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
