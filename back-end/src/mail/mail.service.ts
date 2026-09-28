import { Injectable, Logger } from '@nestjs/common';
import { requireEnv } from '../env.js';

// Ranh giới gửi mail. Khi có RabbitMQ chỉ đổi ruột send() sang publish job.
// Gọi thẳng REST API của Brevo bằng fetch có sẵn — không cần SDK.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey = requireEnv('BREVO_API_KEY');
  private readonly sender = {
    name: requireEnv('MAIL_FROM_NAME'),
    email: requireEnv('MAIL_FROM_EMAIL'),
  };

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

  // Không bao giờ throw: auth gọi không await, lỗi lọt ra thành unhandled
  // rejection làm sập Node. fetch không throw với HTTP 4xx/5xx → tự kiểm tra res.ok.
  private async send(to: string, subject: string, htmlContent: string): Promise<void> {
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
          to: [{ email: to }],
          subject,
          htmlContent,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        this.logger.error(`Gửi mail tới ${to} thất bại: ${res.status} ${await res.text()}`);
      }
    } catch (err) {
      this.logger.error(`Gửi mail tới ${to} thất bại`, err as Error);
    }
  }
}
