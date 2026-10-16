import { Module } from '@nestjs/common';
import { MailConsumer } from './mail.consumer.js';
import { MailService } from './mail.service.js';

// Một nơi khai báo duy nhất: khai báo ở nhiều module = nhiều instance = nhiều consumer trên cùng queue.
@Module({
  providers: [MailService, MailConsumer],
  exports: [MailService],
})
export class MailModule {}
