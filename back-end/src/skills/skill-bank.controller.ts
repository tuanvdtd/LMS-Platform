import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import {
  importSkillQuestionsSchema, type ImportSkillQuestionsInput, listQuestionsQuery, type ListQuestionsQuery,
  skillQuestionSchema, type SkillQuestionInput,
} from './skill-bank.schemas.js';
import { SkillBankService } from './skill-bank.service.js';

// Cả admin và moderator: đều là người của nền tảng, không chia theo danh mục.
@Roles('admin', 'moderator')
@Controller('admin')
export class SkillBankController {
  constructor(private readonly bank: SkillBankService) {}

  @Get('skill-topics')
  topics() {
    return this.bank.topics();
  }

  @Get('skill-topics/:topicId/questions')
  questions(@Param('topicId') topicId: string, @Query(new ZodValidationPipe(listQuestionsQuery)) query: ListQuestionsQuery) {
    return this.bank.questions(topicId, query);
  }

  @Post('skill-topics/:topicId/questions')
  create(@Param('topicId') topicId: string, @Body(new ZodValidationPipe(skillQuestionSchema)) body: SkillQuestionInput) {
    return this.bank.create(topicId, body);
  }

  @Post('skill-topics/:topicId/questions/import')
  import(@Param('topicId') topicId: string, @Body(new ZodValidationPipe(importSkillQuestionsSchema)) body: ImportSkillQuestionsInput) {
    return this.bank.import(topicId, body);
  }

  @Patch('skill-questions/:id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(skillQuestionSchema)) body: SkillQuestionInput) {
    return this.bank.update(id, body);
  }

  @Post('skill-questions/:id/archive')
  @HttpCode(200)
  archive(@Param('id') id: string) {
    return this.bank.setArchived(id, true);
  }

  @Post('skill-questions/:id/restore')
  @HttpCode(200)
  restore(@Param('id') id: string) {
    return this.bank.setArchived(id, false);
  }
}
