import type { INestApplication } from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import express, { type Express } from 'express';
import { AUTH, type Auth } from './auth/auth.js';
import { requireEnv } from './env.js';

// Thứ tự là bắt buộc (spec §5); main.ts và e2e dùng chung để không lệch nhau.
// App phải được tạo với { bodyParser: false }.
export function setupApp(app: INestApplication): void {
  // 1. CORS trước auth handler, không thì /api/auth/* thiếu header CORS.
  app.enableCors({ origin: requireEnv('FE_URL'), credentials: true });
  // 2. .all chứ không .use — .use cắt prefix khỏi req.url, Better Auth sẽ route sai.
  // Nest 12: HttpServer.getInstance() không nhận type argument → ép kiểu.
  (app.getHttpAdapter().getInstance() as Express).all(
    '/api/auth/*splat',
    toNodeHandler(app.get<Auth>(AUTH)),
  );
  // 3. Webhook Stripe cần raw body để kiểm chữ ký (spec stripe-checkout P7). Phải đứng TRƯỚC express.json:
  // express.raw đánh dấu body đã đọc nên express.json bỏ qua. app.use không có prefix 'api' → ghi đủ path.
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
  // 4. Body parser SAU auth handler — Better Auth tự đọc body.
  app.use(express.json());
  app.setGlobalPrefix('api');
}
