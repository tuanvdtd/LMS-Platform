import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { Options } from 'amqplib';
import { requireEnv } from '../env.js';
import type { DeliverStatus, MailJob } from './mail-outcome.js';

// Thiếu timeout thì publish lúc mất kết nối bị buffer trong RAM chứ không reject → fallback không bao giờ chạy.
// Options.Publish (amqplib) không khai báo timeout; amqp-connection-manager đọc nó lúc chạy.
const PUBLISH: Options.Publish & { timeout: number } = { persistent: true, timeout: 5_000 };

// Tên khoá / lý do là nội dung người dùng nhập → escape trước khi chèn vào HTML email.
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Ranh giới gửi mail: send() publish job sang mail.send, MailConsumer gửi.
// Gọi thẳng REST API của Brevo bằng fetch có sẵn — không cần SDK.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey = requireEnv('BREVO_API_KEY');
  private readonly sender = {
    name: requireEnv('MAIL_FROM_NAME'),
    email: requireEnv('MAIL_FROM_EMAIL'),
  };
  private readonly feUrl = requireEnv('FE_URL');

  constructor(private readonly amqp: AmqpConnection) {}

  sendVerification(to: string, url: string) {
    return this.send(
      to,
      'Xác minh email SkillPath',
      `<p>Bấm vào link để xác minh email (hết hạn sau 24 giờ):</p><p><a href="${url}">${url}</a></p>`,
    );
  }

  sendResetPassword(to: string, url: string) {
    return this.send(
      to,
      'Đặt lại mật khẩu SkillPath',
      `<p>Bấm vào link để đặt lại mật khẩu:</p><p><a href="${url}">${url}</a></p>`,
    );
  }

  // Link là link reset password (hạn 1 giờ); hết hạn thì admin gửi lại.
  sendStaffInvite(to: string, url: string) {
    return this.send(
      to,
      'Lời mời làm kiểm duyệt viên SkillPath',
      '<p>Bạn được mời làm kiểm duyệt viên khoá học trên SkillPath.</p>' +
        `<p>Bấm vào link để đặt mật khẩu (hết hạn sau 1 giờ):</p><p><a href="${url}">${url}</a></p>`,
    );
  }

  // Kết quả duyệt khoá.
  sendCourseReviewed(to: string, title: string, approved: boolean, reason: string | null) {
    const t = escapeHtml(title);
    return approved
      ? this.send(to, `Khoá học "${title}" đã được duyệt`, `<p>Khoá học <b>${t}</b> đã được duyệt và xuất bản trên SkillPath.</p>`)
      : this.send(
          to,
          `Khoá học "${title}" chưa được duyệt`,
          `<p>Khoá học <b>${t}</b> chưa được duyệt.</p><p>Lý do: ${escapeHtml(reason ?? '')}</p>` +
            '<p>Bạn có thể chỉnh sửa và gửi duyệt lại.</p>',
        );
  }

  // Kết quả duyệt đơn giảng viên cao cấp.
  sendInstructorApplicationReviewed(to: string, approved: boolean, reason: string | null) {
    const url = `${this.feUrl}/instructor/verification`;
    return approved
      ? this.send(
          to,
          'Bạn đã là giảng viên cao cấp SkillPath',
          '<p>Đơn đăng ký giảng viên cao cấp của bạn đã được duyệt. Giờ bạn có thể đặt giá trả phí cho khoá học.</p>',
        )
      : this.send(
          to,
          'Đơn giảng viên cao cấp chưa được duyệt',
          `<p>Đơn đăng ký giảng viên cao cấp của bạn chưa được duyệt.</p><p>Lý do: ${escapeHtml(reason ?? '')}</p>` +
            `<p>Sửa đơn và gửi lại tại <a href="${url}">${url}</a>.</p>`,
        );
  }

  // Không bao giờ throw: auth gọi không await, lỗi lọt ra thành unhandled rejection làm sập Node.
  // Không publish được → gửi thẳng như trước khi có RabbitMQ
  private async send(to: string, subject: string, htmlContent: string): Promise<void> {
    const job: MailJob = { to, subject, html: htmlContent, attempt: 1 };
    try {
      if (!this.amqp.connected) throw new Error('RabbitMQ chưa kết nối');
      await this.amqp.publish('', 'mail.send', job, PUBLISH);
      return;
    } catch (err) {
      this.logger.warn(`Không publish được mail "${subject}", gửi thẳng Brevo: ${String(err)}`);
      // Chỉ tag — không gắn html/to (token reset mật khẩu).
      Sentry.captureException(err, { tags: { 'mail.fallback': true, subject } });
    }
    const status = await this.deliver(job);
    if (status === 'network' || status < 200 || status >= 300) {
      this.logger.error(`Gửi mail tới ${to} thất bại: ${status}`);
    }
  }

  // Gọi Brevo đúng 1 lần. Không throw: lỗi mạng / timeout → 'network'.
  // fetch không throw với HTTP 4xx/5xx → trả status để nơi gọi quyết định.
  async deliver(job: Pick<MailJob, 'to' | 'subject' | 'html'>): Promise<DeliverStatus> {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: this.sender,
          to: [{ email: job.to }],
          subject: job.subject,
          htmlContent: job.html,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        this.logger.warn(`Brevo ${res.status} khi gửi tới ${job.to}: ${await res.text().catch(() => '')}`);
      }
      return res.status;
    } catch (err) {
      this.logger.warn(`Brevo lỗi mạng khi gửi tới ${job.to}: ${String(err)}`);
      return 'network';
    }
  }
}
