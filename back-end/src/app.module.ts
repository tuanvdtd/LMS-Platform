import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AssetsModule } from './assets/assets.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { CourseApprovalsModule } from './course-approvals/course-approvals.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { CheckoutModule } from './checkout/checkout.module.js';
import { CartModule } from './cart/cart.module.js';
import { CouponsModule } from './coupons/coupons.module.js';
import { CurriculumModule } from './curriculum/curriculum.module.js';
import { DebugController } from './debug.controller.js';
import { optionalEnv } from './env.js';
import { InfraModule } from './infra/infra.module.js';
import { RabbitModule } from './infra/rabbit.module.js';
import { InstructorCoursesModule } from './instructor-courses/instructor-courses.module.js';
import { PreferencesModule } from './preferences/preferences.module.js';
import { QuizModule } from './quiz/quiz.module.js';
import { RevenueModule } from './revenue/revenue.module.js';
import { TopicsModule } from './topics/topics.module.js';

const isProd = optionalEnv('SENTRY_ENVIRONMENT') === 'production';

@Module({
  // SentryModule đứng đầu theo docs.
  imports: [SentryModule.forRoot(), InfraModule, RabbitModule, AuthModule, CategoriesModule, TopicsModule, InstructorCoursesModule, AssetsModule, CurriculumModule, PreferencesModule, RevenueModule, QuizModule, CourseApprovalsModule, CatalogModule, CouponsModule, CartModule, CheckoutModule],
  controllers: [AppController, ...(isProd ? [] : [DebugController])],
  // Chỉ gửi lỗi không phải HttpException; response giữ như BaseExceptionFilter.
  providers: [AppService, { provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}
