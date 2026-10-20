// …/_components/lecture-resources.tsx
'use client';

import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiMessage } from '@/lib/api/checkout';
import { getResourceUrl } from '@/lib/api/learn';
import { formatBytes } from '@/types/curriculum';
import type { LectureResource } from '@/types/learn';

// Link tải ký riêng lúc bấm (TTL 5 phút) → không chết khi trang mở lâu.
export function LectureResources({ courseSlug, resources }: { courseSlug: string; resources: LectureResource[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  async function download(id: string) {
    setBusy(id);
    try {
      window.location.assign(await getResourceUrl(courseSlug, id));
    } catch (e) {
      toast.error(apiMessage(e, 'Không tải được tài liệu'));
    } finally {
      setBusy(null);
    }
  }
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {resources.map((r) => (
        <li key={r.id} className="flex items-center gap-3 px-4 py-3">
          <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {r.fileName} · {formatBytes(r.sizeBytes)}
            </p>
          </div>
          <Button variant="outline" className="h-11" aria-label={`Tải ${r.title}`} disabled={busy === r.id} onClick={() => download(r.id)}>
            <Download data-icon="inline-start" /> Tải
          </Button>
        </li>
      ))}
    </ul>
  );
}
