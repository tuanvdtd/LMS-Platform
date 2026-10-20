import { Module } from '@nestjs/common';
import { LearnController } from './learn.controller.js';
import { LearnService } from './learn.service.js';
import { NotesService } from './notes.service.js';

@Module({
  controllers: [LearnController],
  providers: [LearnService, NotesService],
})
export class LearnModule {}
