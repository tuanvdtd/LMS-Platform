// src/lib/visitor-id.ts
// Mã khách ẩn danh để đếm số người xem trang khoá (phễu chuyển đổi của giảng viên). Nhóm "Cần đồng ý" trong chính sách cookie:
// chỉ lưu lâu dài khi đã bấm "Đồng ý tất cả"; chưa đồng ý → mã tạm trong bộ nhớ cho lần tải trang này. File thuần (node:test).
export const VISITOR_KEY = 'sp-visitor-id';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Store = { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void };

let memory: string | null = null;

export function visitorId(consented: boolean, storage: Store | null, make: () => string = () => crypto.randomUUID()): string {
  try {
    if (consented && storage) {
      const saved = storage.getItem(VISITOR_KEY);
      if (saved && UUID.test(saved)) return saved;
      const fresh = make();
      storage.setItem(VISITOR_KEY, fresh);
      return fresh;
    }
    storage?.removeItem(VISITOR_KEY);
  } catch {
    /* storage bị chặn: dùng mã tạm */
  }
  return (memory ??= make());
}
