// Lựa chọn cookie của người dùng. File thuần (không import alias) → test bằng node:test.
// Lưu ở localStorage chứ không phải cookie: back-end không cần biết, và trang tĩnh khỏi phải đọc cookie.
import { VISITOR_KEY } from './visitor-id.ts';

export type Consent = 'accepted' | 'rejected';

export const CONSENT_KEY = 'sp-cookie-consent';
const CHANGE_EVENT = 'sp:cookie-consent';
const OPEN_EVENT = 'sp:cookie-open';

export function parseConsent(raw: string | null): Consent | null {
  return raw === 'accepted' || raw === 'rejected' ? raw : null;
}

export function getConsent(): Consent | null {
  try {
    return parseConsent(localStorage.getItem(CONSENT_KEY));
  } catch {
    return null; // storage bị chặn: coi như chưa chọn, công cụ không thiết yếu vẫn tắt
  }
}

export function setConsent(value: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
    if (value === 'rejected') localStorage.removeItem(VISITOR_KEY); // từ chối → xoá mã khách đã lưu ngay
  } catch { /* storage bị chặn: lựa chọn chỉ có hiệu lực tới khi tải lại trang */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// 'storage' = tab khác đổi lựa chọn.
export function onConsentChange(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

// Mở lại bảng chọn (nút "Tuỳ chỉnh cookie" ở footer và trang Chính sách bảo mật).
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenCookieSettings(cb: () => void) {
  window.addEventListener(OPEN_EVENT, cb);
  return () => window.removeEventListener(OPEN_EVENT, cb);
}
