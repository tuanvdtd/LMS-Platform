import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import {
  addResourceSchema,
  createItemSchema,
  createSectionSchema,
  moveItemSchema,
  moveSectionSchema,
  setContentSchema,
  updateItemSchema,
  updateSectionSchema,
} from './curriculum.schemas.js';
import type {
  AddResourceInput,
  CreateItemInput,
  CreateSectionInput,
  MoveItemInput,
  MoveSectionInput,
  SetContentInput,
  UpdateItemInput,
  UpdateSectionInput,
} from './curriculum.schemas.js';
import { CurriculumService } from './curriculum.service.js';

type User = AuthSession['user'];

@Roles('instructor')
@Controller('instructor/courses/:courseId')
export class CurriculumController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Get('curriculum')
  get(@CurrentUser() user: User, @Param('courseId') courseId: string) {
    return this.curriculum.get(courseId, user.id);
  }

  @Post('sections')
  addSection(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Body(new ZodValidationPipe(createSectionSchema)) body: CreateSectionInput,
  ) {
    return this.curriculum.addSection(courseId, user.id, body);
  }

  @Patch('sections/:sectionId')
  updateSection(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body(new ZodValidationPipe(updateSectionSchema)) body: UpdateSectionInput,
  ) {
    return this.curriculum.updateSection(courseId, user.id, sectionId, body);
  }

  @Delete('sections/:sectionId')
  deleteSection(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('sectionId') sectionId: string) {
    return this.curriculum.deleteSection(courseId, user.id, sectionId);
  }

  @Post('sections/:sectionId/move')
  @HttpCode(200)
  moveSection(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body(new ZodValidationPipe(moveSectionSchema)) body: MoveSectionInput,
  ) {
    return this.curriculum.moveSection(courseId, user.id, sectionId, body.index);
  }

  @Post('sections/:sectionId/items')
  addItem(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body(new ZodValidationPipe(createItemSchema)) body: CreateItemInput,
  ) {
    return this.curriculum.addItem(courseId, user.id, sectionId, body);
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateItemSchema)) body: UpdateItemInput,
  ) {
    return this.curriculum.updateItem(courseId, user.id, itemId, body);
  }

  @Delete('items/:itemId')
  deleteItem(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('itemId') itemId: string) {
    return this.curriculum.deleteItem(courseId, user.id, itemId);
  }

  @Post('items/:itemId/move')
  @HttpCode(200)
  moveItem(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(moveItemSchema)) body: MoveItemInput,
  ) {
    return this.curriculum.moveItem(courseId, user.id, itemId, body.sectionId, body.index);
  }

  @Put('items/:itemId/content')
  setContent(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(setContentSchema)) body: SetContentInput,
  ) {
    return this.curriculum.setContent(courseId, user.id, itemId, body.assetId);
  }

  @Delete('items/:itemId/content')
  removeContent(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('itemId') itemId: string) {
    return this.curriculum.removeContent(courseId, user.id, itemId);
  }

  @Post('items/:itemId/resources')
  addResource(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(addResourceSchema)) body: AddResourceInput,
  ) {
    return this.curriculum.addResource(courseId, user.id, itemId, body);
  }

  @Delete('resources/:resourceId')
  removeResource(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.curriculum.removeResource(courseId, user.id, resourceId);
  }
}
