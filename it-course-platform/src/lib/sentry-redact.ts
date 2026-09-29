// Link email → back-end redirect về /reset-password?token=<token> (còn hiệu lực).
// `urlQueryParams: false` không áp cho event.request.url (httpContextIntegration),
// breadcrumb navigation (from/to), attribute http.target của span Next server → che tay.
// Không import `@/` để test được bằng node --test.
import type { Breadcrumb, BrowserOptions, ErrorEvent } from '@sentry/nextjs';

export type SpanJSON = Parameters<NonNullable<BrowserOptions['beforeSendSpan']>>[0];

// [?&] để không đụng access_token=…; giữ nguyên ?error=INVALID_TOKEN.
export const redactToken = (value: string): string =>
  value.replace(/([?&]token=)[^&#\s]+/gi, '$1[token]');

// Attribute là giá trị thô hoặc { value, unit } → xử lý cả hai.
export function redactSpan(span: SpanJSON): SpanJSON {
  span.name = redactToken(span.name);
  // Attribute dạng mảng (vd headers) không che: `dataCollection.httpHeaders: false`; phải xử lý nếu bật headers.
  for (const [key, attr] of Object.entries(span.attributes ?? {})) {
    if (typeof attr === 'string') {
      span.attributes![key] = redactToken(attr);
    } else if (attr && typeof attr === 'object' && 'value' in attr && typeof attr.value === 'string') {
      span.attributes![key] = { ...attr, value: redactToken(attr.value) };
    }
  }
  return span;
}

// Chạy trước khi breadcrumb vào scope → breadcrumb trong event lỗi cũng đã sạch.
export function redactBreadcrumb(b: Breadcrumb): Breadcrumb {
  if (b.message) b.message = redactToken(b.message);
  for (const [key, v] of Object.entries(b.data ?? {})) {
    if (typeof v === 'string') b.data![key] = redactToken(v);
  }
  return b;
}

export function redactEvent(event: ErrorEvent): ErrorEvent {
  if (event.request?.url) event.request.url = redactToken(event.request.url);
  if (event.transaction) event.transaction = redactToken(event.transaction);
  // captureRequestError đặt từ req.url của Next → có cả ?token=.
  const nextjs = event.contexts?.nextjs;
  if (typeof nextjs?.request_path === 'string') nextjs.request_path = redactToken(nextjs.request_path);
  return event;
}
