import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { CurriculumService } from '../curriculum/curriculum.service.js';
import { reorder } from '../curriculum/reorder.js';
import { PrismaService } from '../infra/prisma.service.js';
import { QUIZ_MAX_QUESTIONS, type ImportQuestionsInput, type QuestionInput, type UpdateQuizInput } from './quiz.schemas.js';

type Db = Prisma.TransactionClient | PrismaService;

const QUESTION_SELECT = {
  id: true,
  position: true,
  type: true,
  stem: true,
  relatedItemId: true,
  options: {
    orderBy: { position: 'asc' },
    select: { id: true, position: true, content: true, isCorrect: true, explanation: true },
  },
  _count: { select: { answers: true } },
} satisfies Prisma.QuestionSelect;

export const QUIZ_SELECT = {
  description: true,
  passScorePct: true,
  shuffle: true,
  topics: { select: { topicId: true }, orderBy: { topicId: 'asc' } },
  questions: { where: { archivedAt: null }, orderBy: { position: 'asc' }, select: QUESTION_SELECT },
} satisfies Prisma.QuizSelect;

export function toDetail({ topics, questions, ...quiz }: Prisma.QuizGetPayload<{ select: typeof QUIZ_SELECT }>) {
  return {
    ...quiz,
    topicIds: topics.map((t) => t.topicId),
    questions: questions.map(({ _count, ...q }) => ({ ...q, answerCount: _count.answers })),
  };
}

// Soạn quiz. Ghi qua CurriculumService.mutate → trả { quiz, curriculum }.
@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly curriculum: CurriculumService,
  ) {}

  async get(courseId: string, userId: string, itemId: string) {
    // 1 query (DB xa, mỗi round-trip đắt): lọc chủ khoá ngay trong where; không thấy → 404.
    const quiz =
      isGuid(courseId) && isGuid(itemId)
        ? await this.prisma.quiz.findFirst({
            where: { itemId, courseId, course: { instructorId: userId } },
            select: QUIZ_SELECT,
          })
        : null;
    if (!quiz) throw new NotFoundException();
    return toDetail(quiz);
  }

  update(courseId: string, userId: string, itemId: string, body: UpdateQuizInput) {
    return this.write(courseId, userId, itemId, async (tx, quizId) => {
      const { topicIds, ...fields } = body;
      if (topicIds) {
        const inCourse = await tx.courseTopic.count({ where: { courseId, topicId: { in: topicIds } } });
        if (inCourse < topicIds.length) {
          throw validationError([{ path: ['topicIds'], message: 'Chủ đề không thuộc khoá học' }]);
        }
        await tx.quizTopic.deleteMany({ where: { quizId } });
        await tx.quizTopic.createMany({ data: topicIds.map((topicId) => ({ quizId, topicId })) });
      }
      await tx.quiz.update({ where: { id: quizId }, data: fields });
    });
  }

  createQuestion(courseId: string, userId: string, itemId: string, body: QuestionInput) {
    return this.write(courseId, userId, itemId, async (tx, quizId) => {
      await this.checkRelated(tx, courseId, body.relatedItemId);
      const { count, next } = await this.activeStats(tx, quizId);
      this.assertRoom(count, 1);
      await tx.question.create({ data: { quizId, ...this.questionData(body), position: next } });
      await this.syncPublished(tx, quizId, itemId);
    });
  }

  // Nhập nhiều câu (FE đã đọc CSV): thêm cuối theo thứ tự gửi lên; vượt trần thì không nhập câu nào.
  // Không nhận bài giảng liên quan qua import — GV gắn sau bằng form sửa câu.
  importQuestions(courseId: string, userId: string, itemId: string, { questions }: ImportQuestionsInput) {
    return this.write(courseId, userId, itemId, async (tx, quizId) => {
      const { count, next } = await this.activeStats(tx, quizId);
      this.assertRoom(count, questions.length);
      // createMany không tạo quan hệ lồng → tạo câu trước, map lại theo position, rồi tạo đáp án (~5 query cả lô).
      const created = await tx.question.createManyAndReturn({
        data: questions.map((q, i) => ({ quizId, type: q.type, stem: q.stem, relatedItemId: null, position: next + i })),
        select: { id: true, position: true },
      });
      await tx.questionOption.createMany({
        data: created.flatMap(({ id, position }) =>
          questions[position - next].options.map((o, i) => ({ ...o, questionId: id, position: i })),
        ),
      });
      await this.syncPublished(tx, quizId, itemId);
    });
  }

  // Câu đã nằm trong một lượt → archive + tạo phiên bản mới cùng vị trí; lượt cũ giữ đề cũ, không chấm lại.
  updateQuestion(courseId: string, userId: string, itemId: string, questionId: string, body: QuestionInput) {
    return this.write(courseId, userId, itemId, async (tx, quizId) => {
      const question = await this.question(tx, quizId, questionId);
      if (body.type !== question.type) {
        throw validationError([{ path: ['type'], message: 'Không đổi được loại câu hỏi' }]);
      }
      await this.checkRelated(tx, courseId, body.relatedItemId);
      if (await this.isReferenced(tx, quizId, questionId)) {
        await this.archive(tx, quizId, questionId);
        await tx.question.create({ data: { quizId, ...this.questionData(body), position: question.position } });
        return;
      }
      await tx.questionOption.deleteMany({ where: { questionId } });
      await tx.question.update({ where: { id: questionId }, data: this.questionData(body) });
    });
  }

  deleteQuestion(courseId: string, userId: string, itemId: string, questionId: string) {
    return this.write(courseId, userId, itemId, async (tx, quizId) => {
      await this.question(tx, quizId, questionId);
      if (await this.isReferenced(tx, quizId, questionId)) await this.archive(tx, quizId, questionId);
      else await tx.question.delete({ where: { id: questionId } });
      await this.syncPublished(tx, quizId, itemId);
    });
  }

  moveQuestion(courseId: string, userId: string, itemId: string, questionId: string, index: number) {
    return this.write(courseId, userId, itemId, async (tx, quizId) => {
      await this.question(tx, quizId, questionId);
      const rows = await tx.question.findMany({
        where: { quizId, archivedAt: null },
        orderBy: { position: 'asc' },
        select: { id: true },
      });
      const ids = reorder(rows.map((r) => r.id), questionId, index);
      // unique (quizId, position) DEFERRABLE (sql/05) nên trùng tạm trong câu UPDATE không lỗi.
      await tx.$executeRaw`
        UPDATE questions q SET position = (v.ord - 1)::int
        FROM unnest(${ids}::uuid[]) WITH ORDINALITY AS v(id, ord)
        WHERE q.id = v.id`;
    });
  }

  private questionData({ type, stem, relatedItemId, options }: QuestionInput) {
    return {
      type,
      stem,
      relatedItemId: relatedItemId ?? null,
      options: { create: options.map((o, position) => ({ ...o, position })) },
    };
  }

  // Số câu đang hoạt động + position kế tiếp, 1 query.
  private async activeStats(tx: Prisma.TransactionClient, quizId: string) {
    const { _count, _max } = await tx.question.aggregate({
      where: { quizId, archivedAt: null },
      _count: true,
      _max: { position: true },
    });
    return { count: _count, next: (_max.position ?? -1) + 1 };
  }

  private assertRoom(count: number, adding: number) {
    if (count + adding > QUIZ_MAX_QUESTIONS) {
      const room = Math.max(0, QUIZ_MAX_QUESTIONS - count);
      throw validationError([
        { path: ['questions'], message: `Quiz tối đa ${QUIZ_MAX_QUESTIONS} câu, chỉ còn chỗ cho ${room} câu` },
      ]);
    }
  }

  // Câu đã nằm trong một lượt (đang làm hoặc đã nộp) → không sửa đè / xoá cứng, để lượt đó giữ đúng đề.
  private async isReferenced(tx: Prisma.TransactionClient, quizId: string, questionId: string) {
    return (await tx.quizAttempt.count({ where: { quizId, questionIds: { has: questionId } } })) > 0;
  }

  // Unique (quizId, position) tính cả câu archive → đẩy câu cũ sang position âm để nhường chỗ.
  private async archive(tx: Prisma.TransactionClient, quizId: string, questionId: string) {
    const archived = await tx.question.count({ where: { quizId, archivedAt: { not: null } } });
    await tx.question.update({ where: { id: questionId }, data: { archivedAt: new Date(), position: -1 - archived } });
  }

  private async question(tx: Prisma.TransactionClient, quizId: string, id: string) {
    const found = isGuid(id)
      ? await tx.question.findFirst({ where: { id, quizId, archivedAt: null }, select: { position: true, type: true } })
      : null;
    if (!found) throw new NotFoundException();
    return found;
  }

  private async checkRelated(tx: Prisma.TransactionClient, courseId: string, id: string | null | undefined) {
    if (!id) return;
    const ok = await tx.curriculumItem.count({ where: { id, courseId, type: 'lecture' } });
    if (!ok) throw validationError([{ path: ['relatedItemId'], message: 'Bài giảng liên quan không hợp lệ' }]);
  }

  // Quiz có ≥ 1 câu (chưa archive) mới xuất bản.
  private async syncPublished(tx: Prisma.TransactionClient, quizId: string, itemId: string) {
    const count = await tx.question.count({ where: { quizId, archivedAt: null } });
    await tx.curriculumItem.update({ where: { id: itemId }, data: { isPublished: count > 0 } });
  }

  private async write(
    courseId: string,
    userId: string,
    itemId: string,
    fn: (tx: Prisma.TransactionClient, quizId: string) => Promise<void>,
  ) {
    let quizId = '';
    const curriculum = await this.curriculum.mutate(courseId, userId, async (tx) => {
      quizId = await this.quizId(tx, courseId, itemId);
      await fn(tx, quizId);
    });
    return { quiz: await this.read(this.prisma, quizId), curriculum };
  }

  private async quizId(db: Db, courseId: string, itemId: string) {
    const quiz = isGuid(itemId) ? await db.quiz.findFirst({ where: { itemId, courseId }, select: { id: true } }) : null;
    if (!quiz) throw new NotFoundException();
    return quiz.id;
  }

  private async read(db: Db, quizId: string) {
    return toDetail(await db.quiz.findUniqueOrThrow({ where: { id: quizId }, select: QUIZ_SELECT }));
  }
}
