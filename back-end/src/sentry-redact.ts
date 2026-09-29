// Link email đặt lại mật khẩu là GET /api/auth/reset-password/<token> (token trong
// PATH, còn hiệu lực) → `urlQueryParams: false` không che được. Tách file riêng để
// test không phải chạy Sentry.init trong instrument.ts.
import type { ErrorEvent, NodeOptions } from '@sentry/nestjs';

// @sentry/nestjs không export StreamedSpanJSON → lấy từ chữ ký beforeSendSpan.
export type SpanJSON = Parameters<
  NonNullable<NodeOptions['beforeSendSpan']>
>[0];

// `+` để POST /api/auth/reset-password (token trong body) giữ nguyên.
export const redactResetToken = (value: string): string =>
  value.replace(/\/reset-password\/[^/?#]+/g, '/reset-password/[token]');

// Stream mode: URL nằm ở tên span + attribute (url.full, url.path, sentry.segment.name…).
// Attribute là giá trị thô hoặc { value, unit } → xử lý cả hai.
export function redactSpan(span: SpanJSON): SpanJSON {
  span.name = redactResetToken(span.name);
  // Redis: Better Auth dùng token làm key (session, verification:reset-password:<token>)
  // và ioredis DC ghi cả giá trị vào db.query.text → chỉ giữ tên lệnh.
  // Tên span (stream mode) là "<lệnh> host:port", không chứa key.
  if (
    span.attributes['db.system.name'] === 'redis' &&
    'db.query.text' in span.attributes
  ) {
    span.attributes['db.query.text'] =
      span.attributes['db.operation.name'] ?? 'redis';
  }
  // Attribute dạng mảng (vd headers) không che: `dataCollection.httpHeaders: false`; phải xử lý nếu bật headers.
  for (const [key, attr] of Object.entries(span.attributes)) {
    if (typeof attr === 'string') {
      span.attributes[key] = redactResetToken(attr);
    } else if (
      attr &&
      typeof attr === 'object' &&
      'value' in attr &&
      typeof attr.value === 'string'
    ) {
      span.attributes[key] = { ...attr, value: redactResetToken(attr.value) };
    }
  }
  return span;
}

// Lỗi: request.url (requestDataIntegration), transaction ("GET <path>" từ http
// integration), breadcrumb.
export function redactEvent(event: ErrorEvent): ErrorEvent {
  if (event.request?.url)
    event.request.url = redactResetToken(event.request.url);
  if (event.transaction)
    event.transaction = redactResetToken(event.transaction);
  for (const b of event.breadcrumbs ?? []) {
    if (b.message) b.message = redactResetToken(b.message);
    if (typeof b.data?.url === 'string')
      b.data.url = redactResetToken(b.data.url);
  }
  return event;
}
