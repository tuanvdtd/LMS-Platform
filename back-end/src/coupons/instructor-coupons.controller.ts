import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { createCouponSchema } from './coupons.schemas.js';
import type { CreateCouponInput } from './coupons.schemas.js';
import { CouponsService } from './coupons.service.js';

type User = AuthSession['user'];

@Roles('instructor')
@Controller('instructor/courses/:courseId/coupons')
export class InstructorCouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get()
  list(@CurrentUser() user: User, @Param('courseId') courseId: string) {
    return this.coupons.list(courseId, user.id);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Body(new ZodValidationPipe(createCouponSchema)) body: CreateCouponInput,
  ) {
    return this.coupons.create(courseId, user.id, body);
  }

  @Patch(':couponId/disable')
  disable(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('couponId') couponId: string) {
    return this.coupons.disable(courseId, couponId, user.id);
  }
}
