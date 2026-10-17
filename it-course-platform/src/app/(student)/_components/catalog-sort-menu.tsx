'use client';

import Link from 'next/link';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mỗi lựa chọn là <Link> (href dựng ở server) → URL vẫn là nguồn sự thật, giữ nguyên bộ lọc + từ khoá.
export function CatalogSortMenu({ options }: { options: { label: string; href: string; active: boolean }[] }) {
  const current = options.find((o) => o.active)?.label;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className="min-h-11" />}>
        <ArrowUpDown data-icon="inline-start" aria-hidden />
        <span>
          <span className="font-normal text-muted-foreground">Sắp xếp: </span>
          {current}
        </span>
        <ChevronDown data-icon="inline-end" className="text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sắp xếp theo</DropdownMenuLabel>
          {options.map((o) => (
            <DropdownMenuItem
              key={o.href}
              render={<Link href={o.href} aria-current={o.active ? 'true' : undefined} />}
              className="justify-between"
            >
              {o.label}
              {o.active && <Check className="text-primary" aria-hidden />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
