import { Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { CartService } from './cart.service.js';

type User = AuthSession['user'];
const cartQuery = z.object({ couponCode: z.string().trim().max(20).optional() });

@Controller()
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get('cart')
  get(@CurrentUser() user: User, @Query(new ZodValidationPipe(cartQuery)) q: z.output<typeof cartQuery>) {
    return this.cart.get(user.id, q.couponCode || undefined);
  }

  @Post('cart/:courseId')
  @HttpCode(204)
  add(@CurrentUser() user: User, @Param('courseId') courseId: string) {
    return this.cart.add(user.id, courseId);
  }

  @Delete('cart/:courseId')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('courseId') courseId: string) {
    return this.cart.remove(user.id, courseId);
  }

  @Get('me/courses/:courseId/status')
  status(@CurrentUser() user: User, @Param('courseId') courseId: string) {
    return this.cart.status(user.id, courseId);
  }
}
