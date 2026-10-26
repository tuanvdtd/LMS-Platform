import { create } from 'zustand';
import { addToCart, getCart, removeFromCart } from '@/lib/api/checkout';
import { withoutCourse, type Cart } from '@/types/checkout';

interface CartState {
  cart: Cart | null; // giỏ đã tính giá theo couponCode bên dưới
  couponCode: string;
  loading: boolean;
  load: (couponCode?: string) => Promise<void>;
  refresh: () => Promise<void>;
  add: (courseId: string) => Promise<void>;
  remove: (courseId: string) => Promise<void>;
  reset: () => void;
}

// Một nguồn giỏ cho header (badge) và trang giỏ → không còn mỗi nơi tự gọi /cart.
export const useCartStore = create<CartState>()((set, get) => {
  let inflight: { code: string; p: Promise<void> } | null = null;

  // Lượt mới thay lượt cũ: phản hồi về muộn của lượt cũ (đổi mã liên tiếp) bị bỏ qua.
  function fetchCart(code: string): Promise<void> {
    set({ couponCode: code, loading: true });
    const p: Promise<void> = getCart(code || undefined)
      .then((cart) => { if (inflight?.p === p) set({ cart }); })
      .finally(() => { if (inflight?.p === p) { inflight = null; set({ loading: false }); } });
    inflight = { code, p };
    return p;
  }

  return {
    cart: null,
    couponCode: '',
    loading: false,
    // Header và trang giỏ mount cùng lúc với cùng mã → dùng chung một request.
    load: (code = get().couponCode) => (inflight?.code === code ? inflight.p : fetchCart(code)),
    refresh: () => fetchCart(get().couponCode),
    async add(courseId) {
      await addToCart(courseId);
      fetchCart(get().couponCode).catch(() => {}); // khoá đã vào giỏ; badge cập nhật khi giỏ tải xong
    },
    async remove(courseId) {
      const prev = get().cart;
      inflight = null; // phản hồi /cart đang bay có thể còn chứa khoá vừa xoá
      if (prev) set({ cart: withoutCourse(prev, courseId), loading: false });
      try {
        await removeFromCart(courseId);
      } catch (e) {
        await fetchCart(get().couponCode).catch(() => set({ cart: prev }));
        throw e;
      }
      // Có mã thì couponError có thể đổi (vừa xoá khoá duy nhất được áp mã) → hỏi lại BE.
      if (get().couponCode) await fetchCart(get().couponCode).catch(() => {});
    },
    reset: () => {
      inflight = null;
      set({ cart: null, couponCode: '', loading: false });
    },
  };
});
