import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from '@/lib/sentry-options';
import { getConsent, onConsentChange } from '@/lib/cookie-consent';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Sentry ở trình duyệt (báo lỗi, trace, replay) là công cụ không thiết yếu → chỉ chạy khi người dùng
// đã đồng ý ở thanh cookie. Sentry phía server không đọc gì từ thiết bị nên không phụ thuộc lựa chọn này.
let running = false;

function sync() {
  const accepted = getConsent() === 'accepted';
  if (accepted === running) return;
  running = accepted;
  if (!accepted) {
    void Sentry.close(); // rút lại đồng ý: gửi nốt hàng đợi rồi tắt hẳn client
    return;
  }
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
}

sync();
onConsentChange(sync);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
