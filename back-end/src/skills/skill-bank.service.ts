import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, SkillDifficulty } from '@prisma/client';
import { isGuid } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { DIFFICULTY_RATING } from './skill-elo.js';
import type { ImportSkillQuestionsInput, ListQuestionsQuery, SkillQuestionInput } from './skill-bank.schemas.js';

const TX = { ...TX_OPTIONS, timeout: 60_000 }; // import 200 câu trên DB dev chậm

const SELECT = {
  id: true, type: true, stem: true, difficulty: true, rating: true, answerCount: true, correctCount: true, archivedAt: true,
  options: { orderBy: { position: 'asc' }, select: { id: true, content: true, isCorrect: true, explanation: true } },
} satisfies Prisma.SkillQuestionSelect;
type Row = Prisma.SkillQuestionGetPayload<{ select: typeof SELECT }>;
const view = (q: Row) => ({ ...q, rating: Math.round(q.rating) });

const topicNotFound = () => new NotFoundException({ statusCode: 404, code: 'TOPIC_NOT_FOUND', message: 'Không tìm thấy topic' });
const questionNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'SKILL_QUESTION_NOT_FOUND', message: 'Không tìm thấy câu hỏi' });
const optionRows = (input: SkillQuestionInput) =>
  input.options.map((o, position) => ({ content: o.content, isCorrect: o.isCorrect, explanation: o.explanation ?? null, position }));

// Ngân hàng câu kỹ năng cho staff (admin + moderator). Câu do nền tảng soạn → không có khâu duyệt.
@Injectable()
export class SkillBankService {
  constructor(private readonly prisma: PrismaService) {}

  async topics() {
    const [active, archived] = await Promise.all([
      this.prisma.skillQuestion.groupBy({ by: ['topicId', 'difficulty'], where: { archivedAt: null }, _count: { _all: true } }),
      this.prisma.skillQuestion.groupBy({ by: ['topicId'], where: { archivedAt: { not: null } }, _count: { _all: true } }),
    ]);
    const ids = [...new Set([...active, ...archived].map((r) => r.topicId))];
    const topics = await this.prisma.topic.findMany({ where: { id: { in: ids } }, orderBy: { name: 'asc' }, select: { id: true, slug: true, name: true } });
    const count = (topicId: string, d: SkillDifficulty) =>
      active.find((r) => r.topicId === topicId && r.difficulty === d)?._count._all ?? 0;
    return topics.map((t) => ({
      ...t,
      active: { easy: count(t.id, 'easy'), medium: count(t.id, 'medium'), hard: count(t.id, 'hard') },
      archived: archived.find((r) => r.topicId === t.id)?._count._all ?? 0,
    }));
  }

  async questions(topicId: string, query: ListQuestionsQuery) {
    const topic = await this.topic(topicId);
    const rows = await this.prisma.skillQuestion.findMany({
      where: { topicId, archivedAt: query.status === 'active' ? null : { not: null }, ...(query.difficulty && { difficulty: query.difficulty }) },
      orderBy: { createdAt: 'asc' },
      select: SELECT,
    });
    return { topic, questions: rows.map(view) };
  }

  async create(topicId: string, input: SkillQuestionInput) {
    await this.topic(topicId);
    const row = await this.prisma.skillQuestion.create({
      data: {
        topicId, type: input.type, stem: input.stem, difficulty: input.difficulty, rating: DIFFICULTY_RATING[input.difficulty],
        options: { create: optionRows(input) },
      },
      select: SELECT,
    });
    return view(row);
  }

  // Tất cả hoặc không câu nào (zod đã kiểm cả mảng). id sinh sẵn → 2 createMany thay vì N nested create.
  async import(topicId: string, input: ImportSkillQuestionsInput) {
    await this.topic(topicId);
    const rows = input.questions.map((q) => ({ id: randomUUID(), q }));
    await this.prisma.$transaction([
      this.prisma.skillQuestion.createMany({
        data: rows.map(({ id, q }) => ({ id, topicId, type: q.type, stem: q.stem, difficulty: q.difficulty, rating: DIFFICULTY_RATING[q.difficulty] })),
      }),
      this.prisma.skillQuestionOption.createMany({
        data: rows.flatMap(({ id, q }) => optionRows(q).map((o) => ({ ...o, questionId: id }))),
      }),
    ]);
    return { created: rows.length };
  }

  // Thay cả bộ đáp án (kết quả cũ chỉ hiện đề + đúng/sai nên không vỡ). Đổi độ khó = admin chủ ý → R về mốc nhãn mới.
  async update(id: string, input: SkillQuestionInput) {
    const q = await this.question(id);
    if (input.type !== q.type) {
      throw new BadRequestException({ statusCode: 400, code: 'SKILL_TYPE_LOCKED', message: 'Không đổi được loại của câu đã lưu' });
    }
    const reset = input.difficulty !== q.difficulty;
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.skillQuestionOption.deleteMany({ where: { questionId: id } });
      return tx.skillQuestion.update({
        where: { id },
        data: {
          stem: input.stem, difficulty: input.difficulty,
          ...(reset && { rating: DIFFICULTY_RATING[input.difficulty], answerCount: 0, correctCount: 0 }),
          options: { create: optionRows(input) },
        },
        select: SELECT,
      });
    }, TX);
    return view(row);
  }

  async setArchived(id: string, archived: boolean) {
    await this.question(id);
    const row = await this.prisma.skillQuestion.update({ where: { id }, data: { archivedAt: archived ? new Date() : null }, select: SELECT });
    return view(row);
  }

  private async topic(id: string) {
    const t = isGuid(id) ? await this.prisma.topic.findUnique({ where: { id }, select: { id: true, slug: true, name: true } }) : null;
    if (!t) throw topicNotFound();
    return t;
  }

  private async question(id: string) {
    const q = isGuid(id) ? await this.prisma.skillQuestion.findUnique({ where: { id }, select: { type: true, difficulty: true } }) : null;
    if (!q) throw questionNotFound();
    return q;
  }
}
