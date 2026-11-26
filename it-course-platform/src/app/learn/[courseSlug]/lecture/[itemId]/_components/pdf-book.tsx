'use client';

import { type Ref, useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from 'react';
import type { PDFPageProxy, RenderTask } from 'pdfjs-dist';
import type { PageFlip } from 'page-flip';
import { bookShift, nextSpread, pagesToDraw, prevSpread } from './pdf-book-pages';

export type PdfBookApi = { next: () => void; prev: () => void };

// Tiếng lật giấy tổng hợp bằng Web Audio, không cần file âm thanh.
let audio: { ctx: AudioContext; noise: AudioBuffer } | null = null;
function playFlipSound() {
  try {
    if (!audio) {
      const ctx = new AudioContext();
      const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      audio = { ctx, noise };
    }
    const { ctx, noise } = audio;
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.7;
    band.frequency.setValueAtTime(700, t);
    band.frequency.exponentialRampToValueAtTime(3500, t + 0.22);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    src.connect(band).connect(gain).connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.4);
  } catch {
    /* không có Web Audio */
  }
}

// page-flip đã vá (patches/): bản gốc chạy requestAnimationFrame mãi, kể cả sau destroy().
export function PdfBook({
  ref,
  pages,
  width,
  height,
  page,
  sound,
  onPageChange,
  onFail,
}: {
  ref: Ref<PdfBookApi>;
  pages: PDFPageProxy[];
  /** Cỡ một trang (px). */
  width: number;
  height: number;
  /** Trang mở khi dựng sách (từ 0). */
  page: number;
  sound: boolean;
  onPageChange: (page: number) => void;
  onFail: () => void;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<PageFlip | null>(null);
  const pageRef = useRef(page);
  const [at, setAt] = useState(page);

  const changed = useEffectEvent((i: number) => onPageChange(i));
  const failed = useEffectEvent(() => onFail());
  const rustle = useEffectEvent(() => {
    if (sound) playFlipSound();
  });

  // Dời sách ngay khi bắt đầu lật để bìa trượt vào giữa cùng nhịp trang lật.
  useImperativeHandle(ref, () => {
    const go = (dir: 'next' | 'prev') => {
      const book = bookRef.current;
      if (!book) return;
      if (dir === 'next') book.flipNext();
      else book.flipPrev();
      if (book.getState() === 'flipping') setAt(dir === 'next' ? nextSpread(pageRef.current, pages.length) : prevSpread(pageRef.current));
    };
    return { next: () => go('next'), prev: () => go('prev') };
  }, [pages]);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder || !width || !height) return;
    let cancelled = false;
    let book: PageFlip | null = null;
    // page-flip chuyển trang vào cây của nó và destroy() xoá luôn phần tử gốc → dựng ngoài React.
    const host = document.createElement('div');
    holder.append(host);
    const els = pages.map(() => {
      const el = document.createElement('div');
      el.className = 'pdf-book-page';
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 0; // mặc định 300×150
      el.append(canvas);
      return el;
    });
    const canvasOf = (i: number) => els[i].firstChild as HTMLCanvasElement;

    // Chỉ giữ hình vài cặp quanh trang đang mở; vẽ hết thì sách dày tốn hàng trăm MB.
    const tasks = new Map<number, RenderTask>();
    const draw = (i: number) => {
      const base = pages[i].getViewport({ scale: 1 });
      const fit = Math.min(width / base.width, height / base.height);
      const viewport = pages[i].getViewport({ scale: fit * devicePixelRatio });
      const canvas = canvasOf(i);
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${base.width * fit}px`;
      canvas.style.height = `${base.height * fit}px`;
      const task = pages[i].render({ canvas, viewport });
      task.promise.catch(() => {}); // bị huỷ giữa chừng
      tasks.set(i, task);
    };
    const clear = (i: number) => {
      tasks.get(i)?.cancel();
      tasks.delete(i);
      const canvas = canvasOf(i);
      canvas.width = canvas.height = 0;
    };
    const sync = (open: number) => {
      const want = pagesToDraw(open, pages.length);
      for (const i of [...tasks.keys()]) if (!want.includes(i)) clear(i);
      for (const i of want) if (!tasks.has(i)) draw(i);
    };

    import('page-flip')
      .then(({ PageFlip }) => {
        if (cancelled) return;
        const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
        book = new PageFlip(host, {
          width,
          height,
          size: 'fixed',
          usePortrait: false, // khung hẹp đã quay về chế độ cuộn
          showCover: true,
          startPage: pageRef.current,
          flippingTime: still ? 1 : 700,
          showPageCorners: !still,
          maxShadowOpacity: 0.5,
        });
        // 'flipping': nút / phím / lăn / bấm trang; 'user_fold': kéo góc trang.
        book.on('changeState', ({ data }) => {
          if (data === 'flipping' || data === 'user_fold') rustle();
        });
        // Bắn cả lúc loadFromHTML dựng trang đầu.
        book.on('flip', ({ data }) => {
          pageRef.current = data;
          setAt(data);
          changed(data);
          sync(data);
        });
        book.loadFromHTML(els);
        bookRef.current = book;
      })
      .catch(() => {
        if (!cancelled) failed();
      });

    return () => {
      cancelled = true;
      bookRef.current = null;
      for (const i of [...tasks.keys()]) clear(i);
      if (book) book.destroy();
      else host.remove();
    };
  }, [pages, width, height]);

  // my-auto: thấp hơn khung thì nằm giữa, phóng to quá khung vẫn cuộn tới mép trên được.
  return (
    <div
      ref={holderRef}
      className="mx-auto my-auto shrink-0 transition-transform duration-700 ease-in-out motion-reduce:transition-none"
      style={{ width: width * 2, height, transform: `translateX(${bookShift(at, pages.length) * width}px)` }}
    />
  );
}
