import { notFound } from 'next/navigation';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Trang xem bộ nút, chỉ chạy ở dev. Mỗi ô là một trạng thái tĩnh; hover/focus thì rê chuột, bấm Tab.
const STATES = [
  { key: 'default', label: 'Thường' },
  { key: 'loading', label: 'Đang tải' },
  { key: 'locked', label: 'Bị khoá' },
  { key: 'disabled', label: 'Disable' },
] as const;

const ROWS = [
  { key: 'primary', name: 'Nút chính', variant: 'default', icon: Save, label: 'Lưu thay đổi' },
  { key: 'outline', name: 'Nút viền', variant: 'outline', icon: Plus, label: 'Thêm bài giảng' },
  { key: 'icon', name: 'Nút chỉ icon', variant: 'outline', icon: Plus, label: null },
  { key: 'destructive', name: 'Nút xoá', variant: 'destructive', icon: Trash2, label: 'Xoá chương' },
] as const;

export default function ButtonsPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-semibold">Bộ nút</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Rê chuột để xem hover, bấm Tab để xem focus. Nút bị khoá vẫn Tab tới được và có tooltip lý do.
      </p>

      <div className="mt-8 overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium" />
              {STATES.map((s) => (
                <th key={s.key} className="px-4 py-3 font-medium">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {ROWS.map(({ key: row, name, variant, icon: Icon, label }) => (
              <tr key={row}>
                <th className="px-4 py-4 text-left font-medium whitespace-nowrap">{name}</th>
                {STATES.map(({ key }) => (
                  <td key={key} className="px-4 py-4">
                    <Button
                      variant={variant}
                      size={label ? 'default' : 'icon'}
                      aria-label={label ? undefined : 'Thêm bài giảng'}
                      isLoading={key === 'loading'}
                      locked={key === 'locked'}
                      disabled={key === 'disabled'}
                      title={key === 'locked' ? 'Khoá đang chờ duyệt nên tạm khoá chỉnh sửa' : undefined}
                    >
                      <Icon data-icon={label ? 'inline-start' : undefined} aria-hidden />
                      {label}
                    </Button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
