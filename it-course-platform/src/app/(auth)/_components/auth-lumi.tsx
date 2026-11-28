'use client';

import { useEffect, useRef, useState } from 'react';
import { Alignment, Fit, Layout, RuntimeLoader, useRive } from '@rive-app/react-canvas-lite';
import { cn } from '@/lib/utils';

RuntimeLoader.setWasmUrl('/rive/rive.wasm');

// lit: số sách về kệ (0–4, mỗi lần đổi thì đúng một cuốn bay); 10+n: n cuốn nằm sẵn trên kệ, không bay
export type AuthScene = { lit: number; mode: 0 | 1 | 2 | 3; lookX: number };

// Cột trái desktop: giữ trọn cảnh. Dải trên mobile: cắt bớt phần trên, giữ Lumi và kệ sách.
const WIDE = new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter });
const NARROW = new Layout({ fit: Fit.Cover, alignment: Alignment.BottomCenter });
const WIDE_QUERY = '(min-width: 1024px)';

export function AuthLumi({ scene, shakeKey, send, className }: { scene: AuthScene; shakeKey: number; send?: boolean; className?: string }) {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [ready, setReady] = useState(false);
  const { rive, RiveComponent } = useRive({
    src: '/rive/auth.riv',
    artboard: 'Library',
    stateMachines: 'Library',
    autoplay: true,
    layout: window.matchMedia(WIDE_QUERY).matches ? WIDE : NARROW,
    onLoad: () => setReady(true),
  });
  const look = useRef(0.6);
  const pauseTimer = useRef(0);

  useEffect(() => {
    if (!rive) return;
    const mq = window.matchMedia(WIDE_QUERY);
    const apply = () => { rive.layout = mq.matches ? WIDE : NARROW; };
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [rive]);

  useEffect(() => {
    const inputs = rive?.stateMachineInputs('Library');
    if (!rive || !inputs) return;
    const input = (name: string) => inputs.find((i) => i.name === name);
    const [lit, mode, lookX] = [input('lit'), input('mode'), input('lookX')];
    if (!lit || !mode || !lookX) return;
    mode.value = scene.mode;
    lit.value = reduced && scene.lit < 10 ? scene.lit + 10 : scene.lit;

    let raf = 0;
    const step = () => {
      look.current += (scene.lookX - look.current) * (reduced ? 1 : 0.18);
      lookX.value = look.current;
      if (Math.abs(scene.lookX - look.current) > 0.01) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    if (reduced) {
      rive.play();
      window.clearTimeout(pauseTimer.current);
      pauseTimer.current = window.setTimeout(() => rive.pause(), 400);
    }
    return () => cancelAnimationFrame(raf);
  }, [rive, scene, reduced]);

  useEffect(() => {
    if (!rive || !shakeKey) return;
    rive.stateMachineInputs('Library')?.find((i) => i.name === 'shake')?.fire();
    if (!reduced) return;
    rive.play();
    window.clearTimeout(pauseTimer.current);
    pauseTimer.current = window.setTimeout(() => rive.pause(), 400);
  }, [rive, shakeKey, reduced]);

  const sent = useRef(false);
  useEffect(() => {
    if (!rive || !send || reduced || sent.current) return;
    sent.current = true;
    rive.stateMachineInputs('Library')?.find((i) => i.name === 'send')?.fire();
  }, [rive, send, reduced]);

  useEffect(() => () => window.clearTimeout(pauseTimer.current), []);

  return (
    <div aria-hidden className={cn('transition-opacity duration-500', ready ? 'opacity-100' : 'opacity-0', className)}>
      <RiveComponent />
    </div>
  );
}
