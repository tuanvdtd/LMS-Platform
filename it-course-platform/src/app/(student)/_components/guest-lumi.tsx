'use client';

import { useEffect, useState } from 'react';
import { Alignment, Fit, Layout, RuntimeLoader, useRive } from '@rive-app/react-canvas-lite';
import { cn } from '@/lib/utils';

// Wasm tự host (postinstall copy vào public/rive), không gọi CDN.
RuntimeLoader.setWasmUrl('/rive/rive.wasm');

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter });
// Tâm mặt Lumi trên artboard 300×300 (lỗ chữ "a"), để tính hướng nhìn.
const FACE = { x: 142 / 300, y: 176 / 300 };

// Mascot Lumi (Rive, state machine "Lumi"): thở, chớp mắt, nhìn theo con trỏ (input lookX/lookY -1..1);
// rê chuột thì cười vẫy tay, bấm thì nhảy mừng (listener trong file .riv).
// celebrateAfter (ms): tự nhảy mừng sau khi tải, khớp lúc chip "Accepted" trên hero hiện ra.
// Giảm chuyển động: đứng yên, không theo chuột, không tự nhảy.
export function GuestLumi({ celebrateAfter, className }: { celebrateAfter?: number; className?: string }) {
  const [reduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [ready, setReady] = useState(false);
  const { rive, canvas, RiveComponent } = useRive({
    src: '/rive/guest-home.riv',
    artboard: 'Lumi',
    stateMachine: 'Lumi',
    autoplay: !reduced,
    layout: LAYOUT,
    onLoad: () => setReady(true),
  });

  useEffect(() => {
    if (!rive || !canvas || reduced) return;
    const inputs = rive.stateMachineInputs('Lumi') ?? [];
    const input = (name: string) => inputs.find((i) => i.name === name);
    const [lookX, lookY, celebrate] = [input('lookX'), input('lookY'), input('celebrate')];
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;
    // Lerp mỗi frame tới hướng con trỏ cho mắt "đuổi" mềm, dừng khi đã tới nơi.
    const step = () => {
      cur.x += (target.x - cur.x) * 0.14;
      cur.y += (target.y - cur.y) * 0.14;
      if (lookX) lookX.value = cur.x;
      if (lookY) lookY.value = cur.y;
      raf = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.002 ? requestAnimationFrame(step) : 0;
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width * FACE.x);
      const dy = e.clientY - (r.top + r.height * FACE.y);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 360); // xa thì nhìn hết cỡ, gần thì nhìn nhẹ
      target.x = (dx / d) * k;
      target.y = (dy / d) * k;
      if (!raf) raf = requestAnimationFrame(step);
    };
    // Bấm vào Lumi thì nhảy mừng (bắn trigger từ JS cho chắc ăn trên mọi runtime)
    const onDown = () => celebrate?.fire();
    window.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerdown', onDown);
    const timer = celebrateAfter == null ? 0 : window.setTimeout(() => celebrate?.fire(), celebrateAfter);
    return () => {
      window.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [rive, canvas, reduced, celebrateAfter]);

  return (
    <div aria-hidden className={cn('transition-opacity duration-500', ready ? 'opacity-100' : 'opacity-0', className)}>
      <RiveComponent />
    </div>
  );
}

const SCENE_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Cảnh minh hoạ (artboard Study / Teach / Ask, state machine trùng tên) tự lặp; giữ sẵn khung 4:3 nên không xô layout.
// Khung đầu của mỗi vòng lặp là trạng thái đầy đủ, nên khi giảm chuyển động (không autoplay) vẫn là một hình có nghĩa.
export function GuestScene({ artboard, label, className }: { artboard: 'Study' | 'Teach' | 'Ask'; label: string; className?: string }) {
  const [reduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [ready, setReady] = useState(false);
  const { RiveComponent } = useRive({
    src: '/rive/guest-home.riv',
    artboard,
    stateMachine: artboard,
    autoplay: !reduced,
    layout: SCENE_LAYOUT,
    onLoad: () => setReady(true),
  });
  return (
    <div role="img" aria-label={label} className={cn('aspect-[4/3] w-full rounded-[28px] bg-illus-stage', className)}>
      <RiveComponent className={cn('size-full transition-opacity duration-500', ready ? 'opacity-100' : 'opacity-0')} />
    </div>
  );
}
