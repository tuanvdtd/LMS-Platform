import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from '@/lib/sentry-options';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

Sentry.init({
  ...sentryOptions,
  // API khác origin: không khai báo thì trình duyệt không gắn sentry-trace/baggage,
  // trace FE → API đứt đôi. Không dùng '' (khớp mọi URL, lộ header cho bên thứ ba).
  tracePropagationTargets: apiUrl ? [apiUrl] : [],
  // Trang reset luôn được mở bằng tải trang mới (back-end redirect kèm ?token=). rrweb
  // ghi location.href vào meta event của recording, không hook nào sửa được
  // (beforeAddRecordingEvent chỉ nhận custom event) → không bật Replay cho cả document này.
  integrations: window.location.pathname.startsWith('/reset-password')
    ? []
    : [Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true })],
  // Chỉ ghi replay khi có lỗi.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
