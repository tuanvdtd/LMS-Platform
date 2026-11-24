// src/lib/watch-segments.ts
// Đoạn video học viên đã xem (giây nội dung) cho dashboard giữ chân video của giảng viên. File thuần → test bằng node:test.
// Chỉ mở đoạn khi đang phát; timeupdate nhảy 0–3 s là phát liền (kể cả 2× và tab nền giãn nhịp), nhảy khác là tua.
export type Seg = { s: number; e: number };
export type Tracker = { playing: boolean; start: number | null; last: number; done: Seg[] };

export const JUMP_SEC = 3;
export const MAX_PENDING = 20;

export const createTracker = (): Tracker => ({ playing: false, start: null, last: 0, done: [] });

function trim(t: Tracker) {
  if (t.done.length > MAX_PENDING) t.done.splice(0, t.done.length - MAX_PENDING);
}

function close(t: Tracker) {
  if (t.start !== null) {
    const e = Math.floor(t.last);
    if (e - t.start >= 1) t.done.push({ s: t.start, e });
    t.start = null;
  }
  trim(t);
}

export function onPlaying(t: Tracker, time: number) {
  close(t);
  t.playing = true;
  t.last = time;
  t.start = Math.floor(time);
}

export function onTimeUpdate(t: Tracker, time: number) {
  if (!t.playing) {
    t.last = time;
    return;
  }
  const d = time - t.last;
  if (d < 0 || d > JUMP_SEC) {
    close(t);
    t.start = Math.floor(time);
  }
  t.last = time;
}

// seeking / pause / ended: đóng đoạn tại vị trí cuối đã thấy.
export function onStop(t: Tracker) {
  close(t);
  t.playing = false;
}

// seeked: đang phát (không pause) thì mở đoạn tại vị trí mới.
export function onSeeked(t: Tracker, time: number, paused: boolean) {
  t.last = time;
  if (!paused) onPlaying(t, time);
}

// Lấy đoạn chờ gửi; đoạn đang mở bị cắt tại vị trí hiện tại rồi mở tiếp từ đó (không mất phần đang xem).
export function takePending(t: Tracker): Seg[] {
  if (t.playing && t.start !== null) {
    close(t);
    t.start = Math.floor(t.last);
  }
  return t.done.splice(0);
}

// Gửi lỗi mạng / 5xx / 429 → trả đoạn về đầu hàng chờ để lần sau gửi lại.
export function restore(t: Tracker, segs: Seg[]) {
  t.done.unshift(...segs);
  trim(t);
}
