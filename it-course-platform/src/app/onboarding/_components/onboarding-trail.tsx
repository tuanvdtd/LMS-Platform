'use client';

import { useEffect, useRef, useState } from 'react';
import { Alignment, Fit, Layout, RuntimeLoader, useRive } from '@rive-app/react-canvas-lite';
import { cn } from '@/lib/utils';

RuntimeLoader.setWasmUrl('/rive/rive.wasm');

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter });
const MAX_PATCHES = 6;

// step: 0–2 là câu đang trả lời, 3 là đã tới đích. patches: số kỹ năng đã chọn. level: 0 chưa chọn, 1–3.
// instant*: giá trị điền sẵn từ lần trước, đặt thẳng chứ không diễn.
export type TrailState = {
  step: number;
  patches: number;
  level: number;
  pickKey: number;
  instantPatches: boolean;
  instantLevel: boolean;
};

export function OnboardingTrail({ artboard, state, className }: { artboard: 'Trail' | 'TrailWide'; state: TrailState; className?: string }) {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [ready, setReady] = useState(false);
  const { rive, RiveComponent } = useRive({
    src: '/rive/onboarding.riv',
    artboard,
    stateMachines: artboard,
    autoplay: true,
    layout: LAYOUT,
    onLoad: () => setReady(true),
  });
  const placed = useRef(false);
  const pauseTimer = useRef(0);
  const { step, patches, level, pickKey, instantPatches, instantLevel } = state;

  useEffect(() => {
    const inputs = rive?.stateMachineInputs(artboard);
    if (!rive || !inputs) return;
    const set = (name: string, value: number) => {
      const input = inputs.find((i) => i.name === name);
      if (input) input.value = value;
    };
    const first = reduced || !placed.current;
    const n = Math.min(patches, MAX_PATCHES);
    // step 10+n: đứng thẳng ở mốc n. patches/level: đặt cả đích lẫn cờ "Now" trong cùng một khung
    set('at', step);
    set('step', first ? step + 10 : step);
    set('patches', n);
    set('patchesNow', first || instantPatches ? n : -1);
    set('level', level);
    set('levelNow', first || instantLevel ? level : -1);
    set('still', reduced ? 1 : 0);
    placed.current = true;
    if (!reduced) return;
    rive.play();
    window.clearTimeout(pauseTimer.current);
    pauseTimer.current = window.setTimeout(() => rive.pause(), 400);
  }, [rive, artboard, reduced, step, patches, level, instantPatches, instantLevel]);

  useEffect(() => {
    if (!rive || !pickKey || reduced) return;
    rive.stateMachineInputs(artboard)?.find((i) => i.name === 'pick')?.fire();
  }, [rive, artboard, pickKey, reduced]);

  useEffect(() => () => window.clearTimeout(pauseTimer.current), []);

  return (
    <div aria-hidden className={cn('overflow-hidden transition-opacity duration-500', ready ? 'opacity-100' : 'opacity-0', className)}>
      <RiveComponent />
    </div>
  );
}
