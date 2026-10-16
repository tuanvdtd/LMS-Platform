import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service.js';
import { InstructorCouponsController } from './instructor-coupons.controller.js';

@Module({ controllers: [InstructorCouponsController], providers: [CouponsService] })
export class CouponsModule {}
