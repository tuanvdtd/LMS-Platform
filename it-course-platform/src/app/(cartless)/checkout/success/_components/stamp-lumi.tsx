'use client';

import { useEffect, useRef, useState } from 'react';
import { Alignment, Fit, Layout, RuntimeLoader, useRive } from '@rive-app/react-canvas-lite';
import { cn } from '@/lib/utils';

RuntimeLoader.setWasmUrl('/rive/rive.wasm');

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// mood: 0 đang xác nhận, 1 đóng dấu (giảm chuyển động thì vào thẳng tư thế cuối rồi dừng vẽ)
export function StampLumi({ paid, className }: { paid: boolean; className?: string }) {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [ready, setReady] = useState(false);
  const { rive, RiveComponent } = useRive({
    src: '/rive/checkout.riv',
    artboard: 'Stamp',
    stateMachines: 'Stamp',
    autoplay: true,
    layout: LAYOUT,
    onLoad: () => setReady(true),
  });
  const pauseTimer = useRef(0);

  useEffect(() => {
    const mood = rive?.stateMachineInputs('Stamp')?.find((i) => i.name === 'mood');
    if (!rive || !mood) return;
    mood.value = paid ? (reduced ? 11 : 1) : reduced ? 10 : 0;
    if (!reduced) return;
    rive.play();
    window.clearTimeout(pauseTimer.current);
    pauseTimer.current = window.setTimeout(() => rive.pause(), 300);
    return () => window.clearTimeout(pauseTimer.current);
  }, [rive, paid, reduced]);

  return (
    <div aria-hidden className={cn('transition-opacity duration-300', ready ? 'opacity-100' : 'opacity-0', className)}>
      <RiveComponent />
    </div>
  );
}
