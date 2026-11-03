'use client';

import { type FocusEvent, type KeyboardEvent, useState } from 'react';

// Chrome bật :focus-visible ngay khi có phím, kể cả lúc focus đến từ cú bấm chuột → bấm video / tiêu đề phần rồi nhấn
// Space là hiện viền focus. Rải props này lên vùng chứa: focus do chuột thì ẩn viền (CSS [data-pointer-focus] ở
// globals.css), nhấn Tab là người dùng bàn phím → viền hiện lại.
export function usePointerFocus() {
  const [pointer, setPointer] = useState(false);
  return {
    'data-pointer-focus': pointer || undefined,
    onPointerDown: () => setPointer(true),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Tab') setPointer(false);
    },
    onBlur: (e: FocusEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPointer(false);
    },
  };
}
