'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { getPayout, markPayoutPaid } from '@/lib/api/admin';
import { formatPeriod, formatVnd, PAYOUT_STATUS_LABEL } from '@/types/revenue';
import type { AdminPayoutDetail } from '@/types/revenue';

// Trả tiền bằng QR VietQR (R8): quét bằng app ngân hàng → chuyển khoản → nhập mã GD → "Đã trả".
export function PayoutDetail() {
  const { id } = useParams<{ id: string }>();
  const [payout, setPayout] = useState<AdminPayoutDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const [txnRef, setTxnRef] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    getPayout(id).then(setPayout, (e) =>
      axios.isAxiosError(e) && e.response?.status === 404 ? setNotFound(true) : toast.error('Không tải được payout'),
    );
  }, [id]);

  async function markPaid() {
    if (!payout || !window.confirm(`Xác nhận đã chuyển ${formatVnd(payout.amount)} cho ${payout.instructor.name}?`)) return;
    setPaying(true);
    try {
      setPayout(await markPayoutPaid(payout.id, txnRef.trim()));
      toast.success('Đã đánh dấu đã trả');
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        toast.error('Payout này đã được trả trước đó');
        getPayout(id).then(setPayout, () => {});
      } else {
        toast.error('Không cập nhật được, thử lại');
      }
    } finally {
      setPaying(false);
    }
  }

  if (notFound) return <p className="text-sm text-muted-foreground">Không tìm thấy payout.</p>;
  if (!payout) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/payouts" className="text-sm text-primary hover:underline">
        ← Danh sách
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">
          {payout.instructor.name} · {formatPeriod(payout.period)}
        </h1>
        <Badge variant={payout.status === 'paid' ? 'default' : 'secondary'}>{PAYOUT_STATUS_LABEL[payout.status]}</Badge>
      </div>

      <section className="grid gap-6 rounded-2xl border bg-card p-5 sm:grid-cols-[auto_1fr]">
        {payout.qrUrl && !qrFailed && (
          <Image
            src={payout.qrUrl}
            alt="Mã QR chuyển khoản"
            width={240}
            height={240}
            className="rounded-lg border"
            unoptimized
            onError={() => setQrFailed(true)}
          />
        )}
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Số tiền</dt>
          <dd className="font-mono text-lg font-bold">{formatVnd(payout.amount)}</dd>
          <dt className="text-muted-foreground">Mã ngân hàng (BIN)</dt>
          <dd className="font-mono">{payout.bankBin}</dd>
          <dt className="text-muted-foreground">Số tài khoản</dt>
          <dd className="flex items-center gap-2 font-mono">
            {payout.bankAccountNo}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigator.clipboard.writeText(payout.bankAccountNo).then(() => toast.success('Đã copy'))}
            >
              Copy
            </Button>
          </dd>
          <dt className="text-muted-foreground">Chủ tài khoản</dt>
          <dd>{payout.bankAccountName}</dd>
          <dt className="text-muted-foreground">Nội dung CK</dt>
          <dd className="font-mono">SKILLPATH {payout.period}</dd>
          {payout.status === 'paid' && (
            <>
              <dt className="text-muted-foreground">Ngày trả</dt>
              <dd>{payout.paidAt ? new Date(payout.paidAt).toLocaleString('vi-VN') : '—'}</dd>
              <dt className="text-muted-foreground">Mã giao dịch</dt>
              <dd className="font-mono">{payout.bankTxnRef ?? '—'}</dd>
            </>
          )}
        </dl>
      </section>

      {payout.status === 'pending' && (
        <section className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="txn">Mã giao dịch ngân hàng (không bắt buộc)</Label>
            <Input id="txn" maxLength={64} value={txnRef} onChange={(e) => setTxnRef(e.target.value)} className="w-64" />
          </div>
          <Button onClick={markPaid} disabled={paying}>
            {paying ? 'Đang lưu…' : 'Đã trả'}
          </Button>
        </section>
      )}

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 font-bold">Đơn hàng ({payout.items.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">Khoá học</th>
                <th className="py-2 font-medium">Ngày mua</th>
                <th className="py-2 font-medium">Học viên trả</th>
                <th className="py-2 font-medium">Giảng viên nhận</th>
              </tr>
            </thead>
            <tbody>
              {payout.items.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="py-2">{i.course.title}</td>
                  <td className="py-2">{new Date(i.paidAt).toLocaleDateString('vi-VN')}</td>
                  <td className="py-2 font-mono">{formatVnd(i.unitPriceAmount)}</td>
                  <td className="py-2 font-mono">{formatVnd(i.instructorEarnAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
