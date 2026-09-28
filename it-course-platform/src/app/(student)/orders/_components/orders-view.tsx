'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, RotateCcw, Download } from 'lucide-react';
import { Btn } from '@/components/shared/product-ui';

const ORDERS = [
  {
    id: 'ORD-20240301',
    date: '01/03/2024',
    course: 'React Mastery: Từ cơ bản đến nâng cao',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=80&h=50&fit=crop',
    amount: 699000,
    originalAmount: 1299000,
    coupon: 'SKILLPATH10',
    status: 'paid' as const,
    paymentMethod: 'Stripe',
  },
  {
    id: 'ORD-20240215',
    date: '15/02/2024',
    course: 'Node.js Backend Chuyên Sâu',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=80&h=50&fit=crop',
    amount: 849000,
    originalAmount: 849000,
    coupon: null,
    status: 'paid' as const,
    paymentMethod: 'MoMo',
  },
  {
    id: 'ORD-20240110',
    date: '10/01/2024',
    course: 'SQL Mastery & Database Design',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=80&h=50&fit=crop',
    amount: 599000,
    originalAmount: 599000,
    coupon: null,
    status: 'refunded' as const,
    paymentMethod: 'Stripe',
  },
];

function fmt(n: number) {
  return n.toLocaleString('vi-VN') + '₫';
}

export function OrdersView() {
  const [refundModal, setRefundModal] = useState<string | null>(null);

  const order = ORDERS.find((o) => o.id === refundModal);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold mb-6" style={{ color: 'var(--foreground)' }}>Lịch sử đơn hàng</h1>

      {ORDERS.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={40} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ORDERS.map((o) => (
            <div
              key={o.id}
              className="border rounded-2xl p-5"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            >
              <div className="flex items-start gap-4">
                <Image src={o.thumbnail} alt={o.course} width={80} height={48} className="w-20 h-12 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-snug" style={{ color: 'var(--foreground)' }}>{o.course}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <span>#{o.id}</span>
                    <span>{o.date}</span>
                    <span>{o.paymentMethod}</span>
                    {o.coupon && (
                      <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-mono">{o.coupon}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{fmt(o.amount)}</div>
                  {o.originalAmount !== o.amount && (
                    <div className="text-xs line-through" style={{ color: 'var(--muted-foreground)' }}>{fmt(o.originalAmount)}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: o.status === 'paid' ? '#dcfce7' : '#fee2e2',
                    color: o.status === 'paid' ? '#16a34a' : '#dc2626',
                  }}
                >
                  {o.status === 'paid' ? '✓ Đã thanh toán' : '↩ Đã hoàn tiền'}
                </span>
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                  >
                    <Download size={11} /> Hoá đơn
                  </button>
                  {o.status === 'paid' && (
                    <button
                      onClick={() => setRefundModal(o.id)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border hover:bg-red-50 transition-colors text-red-600 border-red-200"
                    >
                      <RotateCcw size={11} /> Yêu cầu hoàn tiền
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refund dialog */}
      {refundModal && order && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md border rounded-2xl p-6 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h2 className="font-extrabold text-lg" style={{ color: 'var(--foreground)' }}>Yêu cầu hoàn tiền</h2>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {order.course}
            </p>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--foreground)' }}>Lý do hoàn tiền</label>
              <select
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option>Nội dung không như mô tả</option>
                <option>Mua nhầm khoá học</option>
                <option>Đã mua ở nơi khác</option>
                <option>Lý do khác</option>
              </select>
            </div>
            <textarea
              placeholder="Mô tả thêm (tuỳ chọn)..."
              rows={3}
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
            <div className="flex gap-2 justify-end">
              <Btn variant="secondary" onClick={() => setRefundModal(null)}>Huỷ</Btn>
              <Btn variant="danger" onClick={() => setRefundModal(null)}>Gửi yêu cầu</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
