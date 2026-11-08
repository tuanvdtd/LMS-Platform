'use client';

import { useEffect, useState } from 'react';

// msLeft tới deadlineMs theo đồng hồ server: giờ server ≈ Date.now() + offsetMs
// (offsetMs = Date.parse(now của server) − Date.now() lúc nhận, bù lệch giờ máy khách).
export function useCountdown(deadlineMs: number, offsetMs: number) {
  const calc = () => Math.max(0, deadlineMs - (Date.now() + offsetMs));
  const [msLeft, setMsLeft] = useState(calc);
  useEffect(() => {
    const tick = () => setMsLeft(Math.max(0, deadlineMs - (Date.now() + offsetMs)));
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadlineMs, offsetMs]);
  return msLeft;
}
