import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isGuid } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';
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
  replyToAnswerId: true,
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
  // answerId null: bình luận đích đã bị xoá hoặc dữ liệu cũ chỉ lưu người → FE hiện "@Tên" không bấm được.
  replyTo: a.replyTo && { ...a.replyTo, answerId: a.replyToAnswerId },
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

// Mở đúng tab Hỏi đáp của bài, ghim câu hỏi, cuộn tới câu trả lời (nếu có). Câu không gắn bài → trang khoá.
const qaLink = (slug: string, itemId: string | null, questionId: string, answerId?: string) =>
  itemId
    ? `/learn/${slug}/lecture/${itemId}?tab=qa&question=${questionId}${answerId ? `&answer=${answerId}` : ''}`
    : `/learn/${slug}`;

// Hỏi đáp khoá học. Học viên: theo slug + ghi danh (chủ khoá cũng vào được khi xem trước); giảng viên: khoá có instructorId = mình.
// Không có quyền / khác khoá → 404, không lộ bài có tồn tại.
@Injectable()
export class QaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsGateway,
  ) {}

  // ---- tìm + kiểm quyền --------------------------------------------------------------------------------

  // Học viên đã ghi danh hoặc chủ khoá (xem trước khoá của mình).
  async learnerCourse(slug: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: { id: true, slug: true, title: true, instructorId: true, enrollments: { where: { userId }, select: { id: true } } },
    });
    if (!course) throw courseNotFound();
    if (!course.enrollments.length && course.instructorId !== userId) throw notEnrolled();
    return course;
  }

  async learnerQuestion(slug: string, userId: string, questionId: string) {
    const { id: courseId } = await this.learnerCourse(slug, userId);
    return this.findQuestion({ id: questionId, courseId }, questionId);
  }

  instructorQuestion(userId: string, questionId: string) {
    return this.findQuestion({ id: questionId, course: { instructorId: userId } }, questionId);
  }

  async learnerAnswer(slug: string, userId: string, answerId: string) {
    const { id: courseId } = await this.learnerCourse(slug, userId);
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
    const { id: courseId } = await this.learnerCourse(slug, userId);
    return this.page({ courseId, ...(q.itemId && { itemId: q.itemId }) }, q.cursor, userId);
  }

  // Một câu hỏi (mở từ thông báo khi câu đó không nằm trong trang đầu danh sách).
  async getForLearner(slug: string, userId: string, questionId: string) {
    const { id: courseId } = await this.learnerCourse(slug, userId);
    const q = isGuid(questionId)
      ? await this.prisma.courseQuestion.findFirst({ where: { id: questionId, courseId }, select: QUESTION_SELECT })
      : null;
    if (!q) throw questionNotFound();
    return presentQuestion(q, userId);
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
    const course = await this.learnerCourse(slug, userId);
    if (body.itemId) {
      const ok = await this.prisma.curriculumItem.count({
        where: { id: body.itemId, courseId: course.id, type: 'lecture', isPublished: true },
      });
      if (!ok) throw itemNotFound();
    }
    const { question, notification } = await this.prisma.$transaction(async (tx) => {
      const q = await tx.courseQuestion.create({
        data: { courseId: course.id, userId, itemId: body.itemId ?? null, body: body.body },
        select: QUESTION_SELECT,
      });
      // Giảng viên biết có câu hỏi mới mà không phải tự mở trang Hỏi đáp.
      const notification =
        userId !== course.instructorId
          ? await tx.notification.create({
              data: {
                userId: course.instructorId,
                type: 'qa_question',
                title: `${q.user.name} đã đặt câu hỏi trong ${course.title}`,
                body: excerpt(q.body),
                link: qaLink(course.slug, q.item?.id ?? null, q.id),
                data: { questionId: q.id },
              },
            })
          : null;
      return { question: presentQuestion(q, userId), notification };
    }, TX_OPTIONS);
    // Đẩy sau commit (xem SubmissionConsumer).
    if (notification) this.notifications.push(notification);
    return question;
  }

  // Quyền xem đã kiểm ở learnerQuestion/instructorQuestion; xoá chỉ tác giả hoặc chủ khoá.
  async removeQuestion(q: QuestionRef, viewerId: string) {
    if (q.userId !== viewerId && q.course.instructorId !== viewerId) throw questionNotFound();
    await this.prisma.courseQuestion.deleteMany({ where: { id: q.id } }); // answers cascade; xoá song song → 0 dòng, không 500
  }

  // ---- câu trả lời ---------------------------------------------------------------------------------------

  // Bộ đếm + mốc giảng viên + notification trong cùng transaction: lỗi giữa chừng không để lệch số.
  async answer(q: QuestionRef, userId: string, { body, replyToAnswerId }: AnswerInput) {
    const isInstructor = userId === q.course.instructorId;
    // Bình luận đích phải nằm trong cùng câu hỏi; lưu cả người viết để còn tên khi bình luận đó bị xoá.
    const target = replyToAnswerId
      ? await this.prisma.courseAnswer.findFirst({ where: { id: replyToAnswerId, questionId: q.id }, select: { id: true, userId: true } })
      : null;
    if (replyToAnswerId && !target) throw answerNotFound();
    const { answer, notifications } = await this.prisma.$transaction(async (tx) => {
      const a = await tx.courseAnswer
        .create({
          data: {
            questionId: q.id,
            userId,
            body,
            isInstructor,
            replyToUserId: target?.userId ?? null,
            replyToAnswerId: target?.id ?? null,
          },
          select: ANSWER_SELECT,
        })
        .catch((e: unknown) => {
          // Bình luận đích bị xoá giữa lúc tra và lúc ghi → FK hỏng: báo 404 như khi không tìm thấy, không 500.
          if (target && e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') throw answerNotFound();
          throw e;
        });
      await tx.courseQuestion.update({ where: { id: q.id }, data: { answerCount: { increment: 1 } } });
      if (isInstructor) {
        // Điều kiện IS NULL: 2 câu trả lời giảng viên song song vẫn giữ mốc sớm nhất.
        await tx.courseQuestion.updateMany({
          where: { id: q.id, instructorAnsweredAt: null },
          data: { instructorAnsweredAt: a.createdAt },
        });
      }
      // Mỗi người tối đa 1 thông báo; người được @ cũng là người hỏi → dùng dòng "trả lời bình luận" (cụ thể hơn).
      const notices: { userId: string; title: string; body: string }[] = [];
      if (target && target.userId !== userId) {
        notices.push({ userId: target.userId, title: `${a.user.name} đã trả lời bình luận của bạn`, body: excerpt(body) });
      }
      if (q.userId !== userId && q.userId !== target?.userId) {
        notices.push({ userId: q.userId, title: 'Có câu trả lời mới', body: `Câu hỏi "${excerpt(q.body)}"` });
      }
      const link = qaLink(q.course.slug, q.item?.id ?? null, q.id, a.id);
      const notifications = [];
      for (const n of notices) {
        notifications.push(
          await tx.notification.create({ data: { ...n, type: 'qa_answer', link, data: { questionId: q.id, answerId: a.id } } }),
        );
      }
      return { answer: presentAnswer(a, userId, q.course.instructorId), notifications };
    }, TX_OPTIONS);
    // Đẩy sau commit (xem SubmissionConsumer).
    for (const n of notifications) this.notifications.push(n);
    return answer;
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
