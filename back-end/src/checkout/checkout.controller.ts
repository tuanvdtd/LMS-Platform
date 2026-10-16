import { BadRequestException, Body, Controller, Headers, HttpCode, Param, Post } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { checkoutSchema, enrollSchema, idempotencyKey } from './checkout.schemas.js';
import type { CheckoutInput, EnrollInput } from './checkout.schemas.js';
import { CheckoutService } from './checkout.service.js';

type User = AuthSession['user'];

@Controller()
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post('checkout')
  @HttpCode(200)
  create(
    @CurrentUser() user: User,
    @Headers('idempotency-key') key: string | undefined,
    @Body(new ZodValidationPipe(checkoutSchema)) body: CheckoutInput,
  ) {
    if (!idempotencyKey.safeParse(key).success) {
      throw new BadRequestException({ statusCode: 400, code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Thiếu Idempotency-Key' });
    }
    return this.checkout.checkout(user.id, key!, body);
  }

  @Post('courses/:courseId/enroll')
  @HttpCode(200)
  enroll(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Body(new ZodValidationPipe(enrollSchema)) body: EnrollInput,
  ) {
    return this.checkout.enroll(user.id, courseId, body);
  }
}
