import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { createNoteSchema, lastItemSchema, progressSchema, updateNoteSchema } from './learn.schemas.js';
import type { CreateNoteInput, LastItemInput, ProgressInput, UpdateNoteInput } from './learn.schemas.js';
import { LearnService } from './learn.service.js';
import { NotesService } from './notes.service.js';

type User = AuthSession['user'];

// Mọi user đăng nhập; ghi danh kiểm trong service.
@Controller('learn/:courseSlug')
export class LearnController {
  constructor(
    private readonly learn: LearnService,
    private readonly notes: NotesService,
  ) {}

  @Get()
  outline(@CurrentUser() user: User, @Param('courseSlug') slug: string) {
    return this.learn.outline(slug, user.id);
  }

  @Put('last-item')
  @HttpCode(204)
  async lastItem(
    @CurrentUser() user: User,
    @Param('courseSlug') slug: string,
    @Body(new ZodValidationPipe(lastItemSchema)) body: LastItemInput,
  ) {
    await this.learn.setLastItem(slug, user.id, body.itemId);
  }

  @Get('lectures/:itemId')
  lecture(@CurrentUser() user: User, @Param('courseSlug') slug: string, @Param('itemId') itemId: string) {
    return this.learn.lecture(slug, user.id, itemId);
  }

  @Post('lectures/:itemId/progress')
  @HttpCode(200)
  progress(
    @CurrentUser() user: User,
    @Param('courseSlug') slug: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(progressSchema)) body: ProgressInput,
  ) {
    return this.learn.progress(slug, user.id, itemId, body);
  }

  @Post('lectures/:itemId/complete')
  @HttpCode(200)
  complete(@CurrentUser() user: User, @Param('courseSlug') slug: string, @Param('itemId') itemId: string) {
    return this.learn.complete(slug, user.id, itemId);
  }

  @Get('resources/:resourceId')
  resource(@CurrentUser() user: User, @Param('courseSlug') slug: string, @Param('resourceId') resourceId: string) {
    return this.learn.resource(slug, user.id, resourceId);
  }

  @Get('lectures/:itemId/notes')
  listNotes(@CurrentUser() user: User, @Param('courseSlug') slug: string, @Param('itemId') itemId: string) {
    return this.notes.list(slug, user.id, itemId);
  }

  @Post('lectures/:itemId/notes')
  createNote(
    @CurrentUser() user: User,
    @Param('courseSlug') slug: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(createNoteSchema)) body: CreateNoteInput,
  ) {
    return this.notes.create(slug, user.id, itemId, body);
  }

  @Patch('notes/:noteId')
  updateNote(
    @CurrentUser() user: User,
    @Param('courseSlug') slug: string,
    @Param('noteId') noteId: string,
    @Body(new ZodValidationPipe(updateNoteSchema)) body: UpdateNoteInput,
  ) {
    return this.notes.update(slug, user.id, noteId, body);
  }

  @Delete('notes/:noteId')
  @HttpCode(204)
  async deleteNote(@CurrentUser() user: User, @Param('courseSlug') slug: string, @Param('noteId') noteId: string) {
    await this.notes.remove(slug, user.id, noteId);
  }
}
