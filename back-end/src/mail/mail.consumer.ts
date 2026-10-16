import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { Options } from 'amqplib';
import { optionalEnv } from '../env.js';
import { MAIL_QUEUES } from '../infra/rabbit.module.js';
import { mailJobSchema, outcomeOf } from './mail-outcome.js';
import { MailService } from './mail.service.js';

const PERSISTENT: Options.Publish = { persistent: true };

// Đọc mail.send → Brevo → ack / mail.retry / mail.dead
// Sentry chỉ gắn tag, không gắn html/to: html reset mật khẩu chứa token
@Injectable()
export class MailConsumer implements OnApplicationBootstrap {
  constructor(
    private readonly amqp: AmqpConnection,
    private readonly mail: MailService,
  ) {}

  onApplicationBootstrap() {
    if (optionalEnv('RABBITMQ_CONSUMERS') === 'off') return;
    // Không await: promise chỉ resolve khi đã có kết nối → await thì app.init() treo lúc broker sập
    // Thư viện gọi handler như hàm thường → bọc arrow để giữ this.
    void this.amqp.createSubscriber(
      (msg) => this.handle(msg),
      { queue: 'mail.send', queueOptions: MAIL_QUEUES['mail.send'] },
      'mail.send',
    );
  }

  // Throw → NACK không requeue → DLX của mail.send đưa message gốc vào mail.dead.
  // Publish ở đây không đặt timeout: mất kết nối giữa chừng thì publish chờ reconnect, message gốc được giao lại
  async handle(raw: unknown): Promise<void> {
    const parsed = mailJobSchema.safeParse(raw);
    try {
      if (!parsed.success) {
        Sentry.captureException(parsed.error, { tags: { queue: 'mail.send', reason: 'invalid' } });
        await this.amqp.publish('', 'mail.dead', { raw, reason: 'invalid' }, PERSISTENT);
        return;
      }
      const job = parsed.data;
      const status = await this.mail.deliver(job);
      const outcome = outcomeOf(status, job.attempt);
      if (outcome === 'retry') {
        await this.amqp.publish('', 'mail.retry', { ...job, attempt: job.attempt + 1 }, PERSISTENT);
      } else if (outcome === 'dead') {
        Sentry.captureException(new Error(`Mail vào mail.dead sau ${job.attempt} lần, Brevo: ${status}`), {
          tags: { queue: 'mail.dead', attempt: job.attempt, status: String(status), subject: job.subject },
        });
        await this.amqp.publish('', 'mail.dead', { ...job, lastStatus: status }, PERSISTENT);
      }
    } catch (err) {
      Sentry.captureException(err, {
        tags: { queue: 'mail.send', ...(parsed.success && { attempt: parsed.data.attempt, subject: parsed.data.subject }) },
      });
      throw err;
    }
  }
}
