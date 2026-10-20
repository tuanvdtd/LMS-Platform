import { MessageHandlerErrorBehavior, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';
import type { Options } from 'amqplib';
import { requireEnv } from '../env.js';

// Arguments của queue là bất biến trên broker. Subscriber luôn assertQueue lại với queueOptions của nó
// (không lấy từ forRoot.queues) → khác arguments là PRECONDITION_FAILED. Một nguồn cho cả hai (spec Q11).
export const MAIL_QUEUES = {
  'mail.send': { durable: true, deadLetterExchange: '', deadLetterRoutingKey: 'mail.dead' },
  'mail.retry': { durable: true, messageTtl: 60_000, deadLetterExchange: '', deadLetterRoutingKey: 'mail.send' },
  // TTL 3 ngày: không chạm trần ~10k message của gói free; link trong mail cũng đã hết hạn.
  'mail.dead': { durable: true, messageTtl: 3 * 24 * 3600_000 },
} satisfies Record<string, Options.AssertQueue>;

// Chấm bài code (spec coding-exercise §5): retry TTL 30 giây quay lại submission.grade; dead giữ 3 ngày.
export const SUBMISSION_QUEUES = {
  'submission.grade': { durable: true, deadLetterExchange: '', deadLetterRoutingKey: 'submission.dead' },
  'submission.retry': { durable: true, messageTtl: 30_000, deadLetterExchange: '', deadLetterRoutingKey: 'submission.grade' },
  'submission.dead': { durable: true, messageTtl: 3 * 24 * 3600_000 },
} satisfies Record<string, Options.AssertQueue>;

// Chấm một bài C++ nhiều test mất vài chục giây → channel riêng để không chặn mail (prefetch tính theo channel).
// Tên này dùng chung cho forRoot.channels và queueOptions.channel của subscriber: gõ sai thì thư viện lặng lẽ rơi về channel mặc định.
export const SUBMISSION_CHANNEL = 'submission';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRoot({
      uri: requireEnv('RABBITMQ_URL'),
      // App vẫn lên khi CloudAMQP sập; reconnect ở nền.
      connectionInitOptions: { wait: false },
      prefetchCount: 1,
      // Không đặt default: true → channel mặc định (mail) vẫn giữ prefetchCount: 1 ở trên.
      channels: { [SUBMISSION_CHANNEL]: { prefetchCount: 1 } },
      // Mặc định của thư viện là REQUEUE → message lỗi quay vòng mãi.
      defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.NACK,
      // Bật thì onApplicationBootstrap await createSubscriber → treo khi broker sập.
      // Consumer tự đăng ký không await (MailConsumer).
      registerHandlers: false,
      queues: Object.entries({ ...MAIL_QUEUES, ...SUBMISSION_QUEUES }).map(([name, options]) => ({ name, options })),
    }),
  ],
  exports: [RabbitMQModule],
})
export class RabbitModule {}
