'use client';

import { useEffect, useRef, useState } from 'react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// Tự lưu sau `delay` ms ngừng đổi. `enabled` false (bài đã xuất bản / bị gỡ) → không tự lưu, chỉ báo `dirty`.
// Lưu lỗi: giữ nguyên nội dung trên màn hình, báo 'error', lần đổi kế tiếp thử lại.
export function useAutosave<T>(value: T, save: (value: T) => Promise<void>, enabled: boolean, delay = 2000) {
  const json = JSON.stringify(value);
  const [savedJson, setSavedJson] = useState(json);
  const [state, setState] = useState<SaveState>('idle');
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const dirty = json !== savedJson;

  useEffect(() => {
    if (!enabled || !dirty) return;
    const timer = setTimeout(() => {
      setState('saving');
      saveRef.current(JSON.parse(json) as T).then(
        () => {
          setSavedJson(json);
          setState('saved');
        },
        () => setState('error'),
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [json, dirty, enabled, delay]);

  // Rời trang khi còn thay đổi chưa lưu → trình duyệt hỏi lại.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return { state, dirty, markSaved: () => setSavedJson(json) };
}
