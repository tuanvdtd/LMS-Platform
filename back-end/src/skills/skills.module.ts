import { Module } from '@nestjs/common';
import { SkillBankController } from './skill-bank.controller.js';
import { SkillBankService } from './skill-bank.service.js';
import { SkillsController } from './skills.controller.js';
import { SkillsService } from './skills.service.js';

@Module({ controllers: [SkillsController, SkillBankController], providers: [SkillsService, SkillBankService] })
export class SkillsModule {}
