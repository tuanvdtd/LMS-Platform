import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DebugController } from './debug.controller.js';
import { optionalEnv } from './env.js';
import { InfraModule } from './infra/infra.module.js';

const isProd = optionalEnv('SENTRY_ENVIRONMENT') === 'production';

@Module({
  // SentryModule đứng đầu theo docs.
  imports: [SentryModule.forRoot(), InfraModule, AuthModule],
  controllers: [AppController, ...(isProd ? [] : [DebugController])],
  // Chỉ gửi lỗi không phải HttpException; response giữ như BaseExceptionFilter.
  providers: [AppService, { provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}
