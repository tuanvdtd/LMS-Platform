// Header nghe event này để tải lại số khoá trong giỏ (spec guest-ui G7). Không cần store cho một con số.
export const CART_CHANGED = 'cart-changed';

export function notifyCartChanged() {
  window.dispatchEvent(new Event(CART_CHANGED));
}
