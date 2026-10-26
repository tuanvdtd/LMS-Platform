'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiMessage } from '@/lib/api/checkout';
import { createCoupon, disableCoupon, listCoupons } from '@/lib/api/coupons';
import { COUPON_TYPE_LABEL, type CouponList } from '@/types/checkout';
import { PRICE_TIERS } from '@/types/instructor-course';
import { formatVnd } from '@/types/revenue';
import { useCourse } from './course-provider';
import { PageHeader } from './form-save';

const DAY = 86_400_000;
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

// Coupon giảng viên: 2 loại, tối đa 3/tháng, fixed ≤31 ngày, free ≤5 ngày.
export function PromotionsView() {
  const { course } = useCourse();
  const [data, setData] = useState<CouponList | null>(null);
  const [type, setType] = useState<'fixed_price' | 'free'>('fixed_price');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState<string>('');
  const [startsAt, setStartsAt] = useState(() => toLocalInput(new Date()));
  const [days, setDays] = useState('30');
  const [maxRedemptions, setMax] = useState('');
  const [saving, setSaving] = useState(false);
  const [disabling, setDisabling] = useState<string | null>(null);

  const load = useCallback(
    () => listCoupons(course.id).then(setData, () => toast.error('Không tải được coupon')),
    [course.id],
  );
  useEffect(() => {
    load();
  }, [load]);

  const tiers = PRICE_TIERS.filter((p) => p > 0 && p < course.priceAmount);
  const maxDays = type === 'free' ? 5 : 31;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Form mở lâu thì giờ bắt đầu đã qua → lấy max(input, bây giờ) để BE không báo "đã qua".
    const start = new Date(Math.max(new Date(startsAt).getTime(), Date.now()));
    try {
      await createCoupon(course.id, {
        code: code.trim().toUpperCase(),
        type,
        priceAmount: type === 'fixed_price' ? Number(price) : undefined,
        startsAt: start.toISOString(),
        endsAt: new Date(start.getTime() + Number(days) * DAY).toISOString(),
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
      });
      toast.success('Đã tạo coupon');
      setCode('');
      load();
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function disable(id: string) {
    setDisabling(id);
    await disableCoupon(course.id, id).then(load, (e) => toast.error(apiMessage(e)));
    setDisabling(null);
  }

  async function copyLink(c: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/course/${data!.courseSlug}?couponCode=${c}`);
    toast.success('Đã sao chép link');
  }

  if (course.status !== 'published' || course.priceAmount === 0) {
    return (
      <>
        <PageHeader title="Khuyến mại" description="Tạo mã giảm giá để chia sẻ khoá học." />
        <Alert className="mt-6">
          <AlertDescription>Chỉ tạo được coupon cho khoá có phí đã xuất bản.</AlertDescription>
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Khuyến mại"
        description="Tạo mã giảm giá (giá cố định hoặc miễn phí) và chia sẻ link. Tối đa 3 coupon mỗi tháng."
      />
      <form onSubmit={submit} className="my-8 grid gap-4 rounded-xl border p-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="coupon-type">Loại</Label>
          <Select
            value={type}
            items={COUPON_TYPE_LABEL}
            onValueChange={(v) => {
              if (!v) return;
              setType(v as typeof type);
              setDays(v === 'free' ? '5' : '30');
            }}
          >
            <SelectTrigger id="coupon-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="fixed_price">Giá cố định</SelectItem>
                <SelectItem value="free">Miễn phí</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">Mã</Label>
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="VD: SALE.OCT" pattern="[A-Z0-9._-]{6,20}" title="6–20 ký tự: A-Z, 0-9, dấu . - _" required />
          <p className="text-xs text-muted-foreground">6–20 ký tự: A-Z, 0-9, dấu . - _</p>
        </div>
        {type === 'fixed_price' ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="coupon-price">Giá sau giảm</Label>
            <Select
              value={price}
              onValueChange={(v) => v && setPrice(v)}
              items={Object.fromEntries(tiers.map((p) => [String(p), formatVnd(p)]))}
            >
              <SelectTrigger id="coupon-price" className="w-full">
                <SelectValue placeholder="Chọn bậc giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {tiers.map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {formatVnd(p)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label htmlFor="max">Số lượt tối đa{type === 'free' ? '' : ' (bỏ trống = không giới hạn)'}</Label>
          <Input id="max" type="number" min={1} value={maxRedemptions} onChange={(e) => setMax(e.target.value)} required={type === 'free'} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="start">Bắt đầu</Label>
          <Input id="start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="days">Số ngày (tối đa {maxDays})</Label>
          <Input id="days" type="number" min={1} max={maxDays} value={days} onChange={(e) => setDays(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving || (type === 'fixed_price' && !price)}>
            Tạo coupon
          </Button>
        </div>
      </form>

      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="py-2">Mã</th>
            <th>Loại</th>
            <th>Giá</th>
            <th>Hiệu lực</th>
            <th>Đã dùng</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data?.items.map((c) => {
            const ended = new Date(c.endsAt) <= new Date() || (!!c.maxRedemptions && c.redeemedCount >= c.maxRedemptions);
            const active = !c.disabledAt && !ended;
            return (
              <tr key={c.id} className="border-t">
                <td className="py-2 font-mono">{c.code}</td>
                <td>{COUPON_TYPE_LABEL[c.type]}</td>
                <td>{c.priceAmount ? formatVnd(c.priceAmount) : 'Miễn phí'}</td>
                <td>
                  {new Date(c.startsAt).toLocaleDateString('vi-VN')} – {new Date(c.endsAt).toLocaleDateString('vi-VN')}
                </td>
                <td>
                  {c.redeemedCount}
                  {c.maxRedemptions ? `/${c.maxRedemptions}` : ''}
                </td>
                <td className="py-2">
                  <div className="flex gap-2">
                  {active && (
                    <Button size="sm" variant="outline" onClick={() => copyLink(c.code)}>
                      Sao chép link
                    </Button>
                  )}
                  {active && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={disabling === c.id}
                      onClick={() => disable(c.id)}
                    >
                      Tắt
                    </Button>
                  )}
                  {!active && <span className="text-muted-foreground">{c.disabledAt ? 'Đã tắt' : 'Đã kết thúc'}</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
