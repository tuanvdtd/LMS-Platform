'use client';

import { useState } from 'react';
import { Alignment, Fit, Layout, RuntimeLoader, useRive } from '@rive-app/react-canvas-lite';
import { cn } from '@/lib/utils';

// Wasm tự host (postinstall copy vào public/rive), không gọi CDN.
RuntimeLoader.setWasmUrl('/rive/rive.wasm');

// Lumi đứng sát mép dưới khung (chữ nằm ngay dưới); pháo giấy phủ kín màn hình, cắt bớt mép thừa theo tỉ lệ màn.
const LAYOUT = {
  Graduate: new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter }),
  Confetti: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
};

// Cảnh chúc mừng hoàn thành khoá (celebrate.riv; nguồn rive/graduate.mjs), state machine trùng tên artboard:
// Graduate = Lumi đội mũ tốt nghiệp nhảy mừng, Confetti = pháo giấy toàn màn hình.
// Chỉ tải khi màn chúc mừng mở (next/dynamic, ssr: false) nên trang học không phải tải runtime Rive.
export default function CelebrateScene({ artboard, className }: { artboard: keyof typeof LAYOUT; className?: string }) {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [ready, setReady] = useState(false);
  const { RiveComponent } = useRive({
    src: '/rive/celebrate.riv',
    artboard,
    // Giảm chuyển động: không chạy state machine (khung đầu của nó là lúc Lumi chưa nhảy, pháo chưa bắn),
    // chỉ dựng khung đầu của 'loop': Lumi giơ cuộn bằng, giấy rải khắp màn hình.
    ...(reduced ? { animations: 'loop', autoplay: false } : { stateMachine: artboard, autoplay: true }),
    layout: LAYOUT[artboard],
    onLoad: () => setReady(true),
  });
  return <RiveComponent className={cn('transition-opacity duration-300', ready ? 'opacity-100' : 'opacity-0', className)} />;
}
