import { Module } from '@nestjs/common';
import { TopicsController } from './topics.controller.js';

@Module({ controllers: [TopicsController] })
export class TopicsModule {}
