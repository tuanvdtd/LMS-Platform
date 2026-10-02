import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AssetsModule } from './assets/assets.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { CurriculumModule } from './curriculum/curriculum.module.js';
import { DebugController } from './debug.controller.js';
import { optionalEnv } from './env.js';
import { InfraModule } from './infra/infra.module.js';
import { InstructorCoursesModule } from './instructor-courses/instructor-courses.module.js';
import { PreferencesModule } from './preferences/preferences.module.js';
import { TopicsModule } from './topics/topics.module.js';

const isProd = optionalEnv('SENTRY_ENVIRONMENT') === 'production';

@Module({
  // SentryModule đứng đầu theo docs.
  imports: [SentryModule.forRoot(), InfraModule, AuthModule, CategoriesModule, TopicsModule, InstructorCoursesModule, AssetsModule, CurriculumModule, PreferencesModule],
  controllers: [AppController, ...(isProd ? [] : [DebugController])],
  // Chỉ gửi lỗi không phải HttpException; response giữ như BaseExceptionFilter.
  providers: [AppService, { provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}
