import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from '../infra/prisma.service.js';
import { RedisService } from '../infra/redis.js';
import { MailService } from '../mail/mail.service.js';
import { AUTH, createAuth } from './auth.js';
import { AuthGuard } from './auth.guard.js';
import { MeController } from './me.controller.js';

// Export AUTH để module khác gọi auth.api.* (vd duyệt giảng viên → setRole).
@Module({
  controllers: [MeController],
  providers: [
    MailService,
    {
      provide: AUTH,
      inject: [PrismaService, RedisService, MailService],
      useFactory: createAuth,
    },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AUTH],
})
export class AuthModule {}
