'use client';

import { useState } from 'react';
import { Alignment, Fit, Layout, RuntimeLoader, useRive } from '@rive-app/react-canvas-lite';
import { cn } from '@/lib/utils';

// Wasm tự host (postinstall copy vào public/rive), không gọi CDN.
RuntimeLoader.setWasmUrl('/rive/rive.wasm');

const LAYOUT = new Layout({ fit: Fit.Cover, alignment: Alignment.Center });

// Lumi đội mũ tốt nghiệp nhảy mừng giữa pháo giấy (celebrate.riv, artboard + state machine "Graduate"; nguồn rive/graduate.mjs).
// Chỉ tải khi hộp thoại chúc mừng mở (next/dynamic, ssr: false) nên trang học không phải tải runtime Rive.
export default function CelebrateScene({ className }: { className?: string }) {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [ready, setReady] = useState(false);
  const { RiveComponent } = useRive({
    src: '/rive/celebrate.riv',
    artboard: 'Graduate',
    // Giảm chuyển động: không chạy state machine (khung đầu của nó là lúc Lumi chưa nhảy, chưa có pháo giấy),
    // chỉ dựng khung đầu của 'loop': Lumi giơ cuộn bằng giữa pháo giấy.
    ...(reduced ? { animations: 'loop', autoplay: false } : { stateMachine: 'Graduate', autoplay: true }),
    layout: LAYOUT,
    onLoad: () => setReady(true),
  });
  return <RiveComponent className={cn('transition-opacity duration-300', ready ? 'opacity-100' : 'opacity-0', className)} />;
}
