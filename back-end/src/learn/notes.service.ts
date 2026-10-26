import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isGuid } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import type { CreateNoteInput, UpdateNoteInput } from './learn.schemas.js';
import { LearnService } from './learn.service.js';

const NOTE_LIMIT = 200;
const NOTE_SELECT = { id: true, positionSec: true, body: true, createdAt: true, updatedAt: true } satisfies Prisma.NoteSelect;

const noteNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'NOTE_NOT_FOUND', message: 'Không tìm thấy ghi chú' });

// Ghi chú riêng của học viên theo bài giảng.
@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learn: LearnService,
  ) {}

  async list(slug: string, userId: string, itemId: string) {
    const { enrollment } = await this.learn.loadLecture(slug, userId, itemId);
    return this.prisma.note.findMany({
      where: { enrollmentId: enrollment.id, itemId },
      orderBy: [{ positionSec: 'asc' }, { createdAt: 'asc' }],
      select: NOTE_SELECT,
    });
  }

  async create(slug: string, userId: string, itemId: string, body: CreateNoteInput) {
    const { item, enrollment } = await this.learn.loadLecture(slug, userId, itemId);
    // ponytail: đếm rồi tạo, không khoá → 2 request song song có thể vượt 200 vài cái; đây chỉ là chặn spam mềm.
    if ((await this.prisma.note.count({ where: { enrollmentId: enrollment.id, itemId } })) >= NOTE_LIMIT) {
      throw new ConflictException({ statusCode: 409, code: 'NOTE_LIMIT', message: `Mỗi bài tối đa ${NOTE_LIMIT} ghi chú` });
    }
    return this.prisma.note.create({
      data: {
        enrollmentId: enrollment.id,
        itemId,
        body: body.body,
        positionSec: item.lectureKind === 'video' ? Math.min(body.positionSec, item.durationSec) : 0,
      },
      select: NOTE_SELECT,
    });
  }

  async update(slug: string, userId: string, noteId: string, body: UpdateNoteInput) {
    const id = await this.own(slug, userId, noteId);
    return this.prisma.note.update({ where: { id }, data: { body: body.body }, select: NOTE_SELECT });
  }

  async remove(slug: string, userId: string, noteId: string) {
    await this.prisma.note.delete({ where: { id: await this.own(slug, userId, noteId) } });
  }

  // Không phải của mình / khác khoá → 404 (không 403, không lộ ghi chú có tồn tại).
  private async own(slug: string, userId: string, noteId: string) {
    const note = isGuid(noteId)
      ? await this.prisma.note.findFirst({ where: { id: noteId, enrollment: { userId, course: { slug } } }, select: { id: true } })
      : null;
    if (!note) throw noteNotFound();
    return note.id;
  }
}
