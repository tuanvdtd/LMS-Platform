'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Tag } from 'lucide-react';
import { courses } from '@/lib/mocks/data';
import { PriceTag, CourseCard, Btn } from '@/components/shared/product-ui';
import { buttonVariants } from '@/components/ui/button';

export default function CartView() {
  const [cartItems, setCartItems] = useState([courses[0], courses[4]]);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const total = cartItems.reduce((s, c) => s + c.price, 0);
  const discount = couponApplied ? Math.round(total * 0.1) : 0;
  const final = total - discount;

  function remove(id: string) {
    setCartItems((items) => items.filter((c) => c.id !== id));
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-6" style={{ color: 'var(--foreground)' }}>
        Giỏ hàng ({cartItems.length} khoá)
      </h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg mb-4" style={{ color: 'var(--muted-foreground)' }}>Giỏ hàng trống</p>
          <Link href="/courses" className={buttonVariants()}>Khám phá khoá học</Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart items */}
          <div className="flex-1 space-y-4">
            {cartItems.map((course) => (
              <div
                key={course.id}
                className="flex gap-4 border-b pb-4"
                style={{ borderColor: 'var(--border)' }}
              >
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  width={96}
                  height={64}
                  className="w-24 h-16 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/course/${course.slug}`}
                    className="font-semibold text-sm hover:text-blue-600 transition-colors line-clamp-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {course.title}
                  </Link>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    {course.instructor.name}
                  </p>
                  <div className="mt-2">
                    <PriceTag price={course.price} originalPrice={course.originalPrice} size="sm" />
                  </div>
                </div>
                <button
                  onClick={() => remove(course.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors shrink-0"
                  aria-label={`Xoá ${course.title} khỏi giỏ`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:w-72 shrink-0">
            <div className="border rounded-2xl p-5 sticky top-20" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <h2 className="font-bold mb-4" style={{ color: 'var(--foreground)' }}>Tổng đơn hàng</h2>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted-foreground)' }}>Tạm tính</span>
                  <span style={{ color: 'var(--foreground)' }}>{total.toLocaleString('vi-VN')}₫</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá (10%)</span>
                    <span>-{discount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--foreground)' }}>Tổng cộng</span>
                  <span style={{ color: 'var(--accent)' }}>{final.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 flex items-center gap-1.5 border rounded-lg px-2 py-1.5" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                  <Tag size={13} style={{ color: 'var(--muted-foreground)' }} />
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Mã giảm giá"
                    className="flex-1 text-sm outline-none bg-transparent"
                    style={{ color: 'var(--foreground)' }}
                  />
                </div>
                <Btn
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (coupon.toUpperCase() === 'SKILLPATH10') setCouponApplied(true);
                  }}
                >
                  Áp dụng
                </Btn>
              </div>
              {couponApplied && (
                <p className="text-xs text-green-600 mb-3">✓ Mã giảm giá đã được áp dụng</p>
              )}

              <Link
                href="/checkout/success"
                className="block w-full text-center py-3 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                Thanh toán ({final.toLocaleString('vi-VN')}₫)
              </Link>
              <p className="text-xs text-center mt-3" style={{ color: 'var(--muted-foreground)' }}>
                30 ngày hoàn tiền nếu không hài lòng
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="mt-12">
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Thường được mua cùng
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {courses.slice(1, 3).map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      </div>
    </div>
  );
}
