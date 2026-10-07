'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { getRevenueShare, setRevenueShare } from '@/lib/api/admin';

// Tỷ lệ chia chung (R2). Chỉ áp cho đơn mới; đơn cũ đã snapshot số tiền.
export function RevenueShareForm() {
  const [saved, setSaved] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getRevenueShare().then(
      (r) => {
        setSaved(r.sharePct);
        setValue(String(r.sharePct));
      },
      () => toast.error('Không tải được cài đặt'),
    );
  }, []);

  const n = Number(value);
  const valid = value !== '' && Number.isInteger(n) && n >= 0 && n <= 100;

  async function save() {
    setSaving(true);
    try {
      const r = await setRevenueShare(n);
      setSaved(r.sharePct);
      toast.success('Đã lưu tỷ lệ chia');
    } catch {
      toast.error('Không lưu được, thử lại');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-extrabold">Cài đặt</h1>
      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <Label htmlFor="share">Tỷ lệ giảng viên nhận (%)</Label>
        {saved === null ? (
          <Skeleton className="h-9 w-32" />
        ) : (
          <div className="flex items-center gap-2">
            <Input
              id="share"
              type="number"
              min={0}
              max={100}
              step={1}
              className="w-32"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={!valid}
            />
            <span className="text-sm text-muted-foreground">Platform nhận {valid ? 100 - n : '—'}%</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Chỉ áp dụng cho đơn hàng mới. Đơn cũ giữ số tiền lúc mua.</p>
        <Button onClick={save} disabled={!valid || n === saved || saving}>
          {saving ? 'Đang lưu…' : 'Lưu'}
        </Button>
      </section>
    </div>
  );
}
