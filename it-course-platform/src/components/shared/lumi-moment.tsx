'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alignment, Fit, Layout, RuntimeLoader, useRive } from '@rive-app/react-canvas-lite';
import { masteryLevel } from '@/lib/skills';
import { cn } from '@/lib/utils';

// Wasm tự host (postinstall copy vào public/rive), không gọi CDN.
RuntimeLoader.setWasmUrl('/rive/rive.wasm');

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// mood: -1 trống, n phản ứng rồi giữ tư thế cuối, 10+n vào thẳng tư thế cuối (giảm chuyển động: chạy vài khung rồi dừng vẽ)
function useLumi(artboard: 'Coder' | 'Examiner') {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [ready, setReady] = useState(false);
  const { rive, RiveComponent } = useRive({
    src: '/rive/lumi.riv',
    artboard,
    stateMachines: artboard,
    autoplay: true,
    layout: LAYOUT,
    onLoad: () => setReady(true),
  });
  const pauseTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(pauseTimer.current), []);

  const input = useCallback((name: string) => rive?.stateMachineInputs(artboard)?.find((i) => i.name === name), [rive, artboard]);
  const react = useCallback(
    (mood: number, animate: boolean) => {
      const m = input('mood');
      if (!rive || !m) return;
      m.value = mood < 0 || (animate && !reduced) ? mood : mood + 10;
      if (!reduced) return;
      rive.play();
      window.clearTimeout(pauseTimer.current);
      pauseTimer.current = window.setTimeout(() => rive.pause(), 300);
    },
    [rive, input, reduced],
  );

  const view = (className?: string) => (
    <div aria-hidden className={cn('transition-opacity duration-300', ready ? 'opacity-100' : 'opacity-0', className)}>
      <RiveComponent />
    </div>
  );
  return { rive, reduced, input, react, view };
}

export type CoderMood = 0 | 1 | 2;

// Chỉ phản ứng khi kết quả vừa chấm xong; mở bài nộp cũ thì đứng sẵn ở tư thế cuối
export function CoderLumi({ mood, className }: { mood: CoderMood; className?: string }) {
  const { rive, react, view } = useLumi('Coder');
  const prev = useRef(-1);
  useEffect(() => {
    if (!rive) return;
    react(mood, mood === 0 || prev.current === 0);
    prev.current = mood;
  }, [rive, mood, react]);
  return view(className);
}

export type ExaminerMood = -1 | 0 | 1 | 2 | 3;

const isStrong = (pct: number) => masteryLevel(pct) === 'strong';

// peak: 0 chưa tới mức Vững, 1 vừa vượt qua (cắm cờ), 2 đã ở sẵn
export function ExaminerLumi({ mood, from, to, className }: { mood: ExaminerMood; from: number; to: number; className?: string }) {
  const { rive, reduced, input, react, view } = useLumi('Examiner');
  useEffect(() => {
    const level = input('level');
    const peak = input('peak');
    if (!rive || !level || !peak) return;
    if (reduced || mood < 0 || from === to) {
      level.value = to;
      peak.value = isStrong(to) ? 2 : 0;
      react(mood, !reduced);
      return;
    }
    let strong = isStrong(from);
    peak.value = strong ? 2 : 0;
    const set = (pct: number) => {
      level.value = pct;
      if (isStrong(pct) === strong) return;
      strong = !strong;
      peak.value = strong ? 1 : 0;
    };
    set(from);
    react(mood, true);
    // 1s, khớp đoạn đầu của phản ứng trong file .riv
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 1000);
      set(from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [rive, input, react, reduced, mood, from, to]);
  return view(className);
}
