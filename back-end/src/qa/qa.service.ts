import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isGuid } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { courseNotFound, itemNotFound, notEnrolled } from '../learn/learn.service.js';
import type { AnswerInput, CreateQuestionInput, InstructorQuestionsQuery, LearnQuestionsQuery } from './qa.schemas.js';

const PAGE = 20;
const AUTHOR = { select: { id: true, name: true, image: true } } as const;
const ANSWER_SELECT = {
  id: true,
  body: true,
  createdAt: true,
  isInstructor: true,
  userId: true,
  user: AUTHOR,
  replyTo: { select: { id: true, name: true } },
} satisfies Prisma.CourseAnswerSelect;
// Kiểm quyền + trả lời/xoá: không cần kéo theo danh sách trả lời.
const QUESTION_REF_SELECT = {
  id: true,
  body: true,
  userId: true,
  item: { select: { id: true } },
  course: { select: { slug: true, instructorId: true } },
} satisfies Prisma.CourseQuestionSelect;
// Danh sách kiểu bình luận: trả lời đi kèm câu hỏi (FE hiện 2 cái + "Xem thêm").
// ponytail: kéo hết trả lời của 20 câu/trang; thêm giới hạn khi một câu có hàng trăm trả lời.
const QUESTION_SELECT = {
  id: true,
  body: true,
  createdAt: true,
  answerCount: true,
  instructorAnsweredAt: true,
  userId: true,
  item: { select: { id: true, title: true } },
  user: AUTHOR,
  course: { select: { id: true, title: true, slug: true, instructorId: true } },
  answers: { orderBy: { id: 'asc' }, select: ANSWER_SELECT },
} satisfies Prisma.CourseQuestionSelect;
// Xoá câu trả lời cần biết chủ khoá để kiểm quyền.
const ANSWER_DELETE_SELECT = {
  id: true,
  userId: true,
  isInstructor: true,
  questionId: true,
  question: { select: { course: { select: { instructorId: true } } } },
} satisfies Prisma.CourseAnswerSelect;

type QuestionRow = Prisma.CourseQuestionGetPayload<{ select: typeof QUESTION_SELECT }>;
export type QuestionRef = Prisma.CourseQuestionGetPayload<{ select: typeof QUESTION_REF_SELECT }>;
type AnswerRow = Prisma.CourseAnswerGetPayload<{ select: typeof ANSWER_SELECT }>;
export type AnswerDeleteRow = Prisma.CourseAnswerGetPayload<{ select: typeof ANSWER_DELETE_SELECT }>;

const questionNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'QUESTION_NOT_FOUND', message: 'Không tìm thấy câu hỏi' });
const answerNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'ANSWER_NOT_FOUND', message: 'Không tìm thấy câu trả lời' });

const presentAnswer = (a: AnswerRow, viewerId: string, instructorId: string) => ({
  id: a.id,
  body: a.body,
  createdAt: a.createdAt,
  author: a.user,
  isInstructor: a.isInstructor,
  replyTo: a.replyTo,
  canDelete: a.userId === viewerId || instructorId === viewerId,
});

const presentQuestion = (q: QuestionRow, viewerId: string) => ({
  id: q.id,
  body: q.body,
  createdAt: q.createdAt,
  item: q.item,
  course: { id: q.course.id, title: q.course.title, slug: q.course.slug },
  author: q.user,
  answerCount: q.answerCount,
  instructorAnswered: q.instructorAnsweredAt !== null,
  canDelete: q.userId === viewerId || q.course.instructorId === viewerId,
  answers: q.answers.map((a) => presentAnswer(a, viewerId, q.course.instructorId)),
});

// Nội dung là Markdown nhiều dòng → gom khoảng trắng cho vừa 1 dòng thông báo.
const excerpt = (s: string) => {
  const line = s.replace(/\s+/g, ' ');
  return line.length > 80 ? `${line.slice(0, 79)}…` : line;
};

// Hỏi đáp khoá học (spec 2026-10-20-course-qa). Học viên: theo slug + ghi danh; giảng viên: khoá có instructorId = mình.
// Không có quyền / khác khoá → 404, không lộ bài có tồn tại.
@Injectable()
export class QaService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- tìm + kiểm quyền --------------------------------------------------------------------------------

  async learnerCourse(slug: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: { id: true, enrollments: { where: { userId }, select: { id: true } } },
    });
    if (!course) throw courseNotFound();
    if (!course.enrollments.length) throw notEnrolled();
    return course.id;
  }

  async learnerQuestion(slug: string, userId: string, questionId: string) {
    const courseId = await this.learnerCourse(slug, userId);
    return this.findQuestion({ id: questionId, courseId }, questionId);
  }

  instructorQuestion(userId: string, questionId: string) {
    return this.findQuestion({ id: questionId, course: { instructorId: userId } }, questionId);
  }

  async learnerAnswer(slug: string, userId: string, answerId: string) {
    const courseId = await this.learnerCourse(slug, userId);
    return this.findAnswer({ id: answerId, question: { courseId } }, answerId);
  }

  instructorAnswer(userId: string, answerId: string) {
    return this.findAnswer({ id: answerId, question: { course: { instructorId: userId } } }, answerId);
  }

  private async findQuestion(where: Prisma.CourseQuestionWhereInput, id: string) {
    const q = isGuid(id) ? await this.prisma.courseQuestion.findFirst({ where, select: QUESTION_REF_SELECT }) : null;
    if (!q) throw questionNotFound();
    return q;
  }

  private async findAnswer(where: Prisma.CourseAnswerWhereInput, id: string) {
    const a = isGuid(id) ? await this.prisma.courseAnswer.findFirst({ where, select: ANSWER_DELETE_SELECT }) : null;
    if (!a) throw answerNotFound();
    return a;
  }

  // ---- câu hỏi -------------------------------------------------------------------------------------------

  async listForLearner(slug: string, userId: string, q: LearnQuestionsQuery) {
    const courseId = await this.learnerCourse(slug, userId);
    return this.page({ courseId, ...(q.itemId && { itemId: q.itemId }) }, q.cursor, userId);
  }

  listForInstructor(userId: string, q: InstructorQuestionsQuery) {
    return this.page(
      {
        course: { instructorId: userId },
        ...(q.courseId && { courseId: q.courseId }),
        ...(q.unanswered && { instructorAnsweredAt: null }),
      },
      q.cursor,
      userId,
    );
  }

  // uuid7 tăng theo thời gian → id desc = mới nhất trước, cursor = id cuối trang.
  // total: số câu hỏi khớp bộ lọc (tiêu đề "Hỏi đáp N").
  private async page(where: Prisma.CourseQuestionWhereInput, cursor: string | undefined, viewerId: string) {
    const [rows, total] = await Promise.all([
      this.prisma.courseQuestion.findMany({
        where: cursor ? { AND: [where, { id: { lt: cursor } }] } : where,
        orderBy: { id: 'desc' },
        take: PAGE + 1,
        select: QUESTION_SELECT,
      }),
      this.prisma.courseQuestion.count({ where }),
    ]);
    const items = rows.slice(0, PAGE).map((r) => presentQuestion(r, viewerId));
    return { items, total, nextCursor: rows.length > PAGE ? items[PAGE - 1].id : null };
  }

  async create(slug: string, userId: string, body: CreateQuestionInput) {
    const courseId = await this.learnerCourse(slug, userId);
    if (body.itemId) {
      const ok = await this.prisma.curriculumItem.count({
        where: { id: body.itemId, courseId, type: 'lecture', isPublished: true },
      });
      if (!ok) throw itemNotFound();
    }
    const q = await this.prisma.courseQuestion.create({
      data: { courseId, userId, itemId: body.itemId ?? null, body: body.body },
      select: QUESTION_SELECT,
    });
    return presentQuestion(q, userId);
  }

  // Quyền xem đã kiểm ở learnerQuestion/instructorQuestion; xoá chỉ tác giả hoặc chủ khoá.
  async removeQuestion(q: QuestionRef, viewerId: string) {
    if (q.userId !== viewerId && q.course.instructorId !== viewerId) throw questionNotFound();
    await this.prisma.courseQuestion.deleteMany({ where: { id: q.id } }); // answers cascade; xoá song song → 0 dòng, không 500
  }

  // ---- câu trả lời ---------------------------------------------------------------------------------------

  // Bộ đếm + mốc giảng viên + notification trong cùng transaction (spec §3).
  async answer(q: QuestionRef, userId: string, { body, replyToAnswerId }: AnswerInput) {
    const isInstructor = userId === q.course.instructorId;
    // Câu được trả lời phải nằm trong cùng câu hỏi; lấy người viết để FE ghi "Trả lời <tên>".
    const target = replyToAnswerId
      ? await this.prisma.courseAnswer.findFirst({ where: { id: replyToAnswerId, questionId: q.id }, select: { userId: true } })
      : null;
    if (replyToAnswerId && !target) throw answerNotFound();
    return this.prisma.$transaction(async (tx) => {
      const a = await tx.courseAnswer.create({
        data: { questionId: q.id, userId, body, isInstructor, replyToUserId: target?.userId ?? null },
        select: ANSWER_SELECT,
      });
      await tx.courseQuestion.update({ where: { id: q.id }, data: { answerCount: { increment: 1 } } });
      if (isInstructor) {
        // Điều kiện IS NULL: 2 câu trả lời giảng viên song song vẫn giữ mốc sớm nhất.
        await tx.courseQuestion.updateMany({
          where: { id: q.id, instructorAnsweredAt: null },
          data: { instructorAnsweredAt: a.createdAt },
        });
      }
      if (userId !== q.userId) {
        await tx.notification.create({
          data: {
            userId: q.userId,
            type: 'qa_answer',
            title: 'Có câu trả lời mới',
            body: `Câu hỏi "${excerpt(q.body)}"`,
            link: q.item ? `/learn/${q.course.slug}/lecture/${q.item.id}` : `/learn/${q.course.slug}`,
            data: { questionId: q.id, answerId: a.id },
          },
        });
      }
      return presentAnswer(a, userId, q.course.instructorId);
    }, TX_OPTIONS);
  }

  async removeAnswer(a: AnswerDeleteRow, viewerId: string) {
    if (a.userId !== viewerId && a.question.course.instructorId !== viewerId) throw answerNotFound();
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.courseAnswer.deleteMany({ where: { id: a.id } });
      if (!count) return; // đã bị xoá song song (hoặc câu hỏi bị xoá) → không đếm lại
      await tx.courseQuestion.update({ where: { id: a.questionId }, data: { answerCount: { decrement: 1 } } });
      if (a.isInstructor) {
        const first = await tx.courseAnswer.findFirst({
          where: { questionId: a.questionId, isInstructor: true },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        });
        await tx.courseQuestion.update({ where: { id: a.questionId }, data: { instructorAnsweredAt: first?.createdAt ?? null } });
      }
    }, TX_OPTIONS);
  }
}
