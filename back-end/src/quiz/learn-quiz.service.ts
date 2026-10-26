import { randomUUID } from 'node:crypto';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isGuid } from '../common/zod.pipe.js';
import { completeItem } from '../curriculum/progress.js';
import { PrismaService } from '../infra/prisma.service.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { recomputeMastery } from '../topics/mastery.js';
import { grade, seededShuffle } from './grading.js';
import type { SubmitInput } from './learn-quiz.schemas.js';

// Submit ~10 query trong transaction; DB dev ~1-2s/query → 15s của TX_OPTIONS không đủ.
const SUBMIT_TX = { ...TX_OPTIONS, timeout: 60_000 };

const OPTION_SELECT = {
  orderBy: { position: 'asc' },
  select: { id: true, content: true, isCorrect: true, explanation: true },
} satisfies Prisma.Question$optionsArgs;

const QUESTION_SELECT = {
  id: true,
  type: true,
  stem: true,
  points: true,
  options: OPTION_SELECT,
  relatedItem: { select: { id: true, title: true } },
} satisfies Prisma.QuestionSelect;

const LEARN_QUIZ_SELECT = {
  id: true,
  courseId: true,
  passScorePct: true,
  shuffle: true,
  description: true,
  item: { select: { title: true } },
  topics: { select: { topic: { select: { id: true, name: true } } } },
  questions: { where: { archivedAt: null }, orderBy: { position: 'asc' }, select: QUESTION_SELECT },
} satisfies Prisma.QuizSelect;
type LearnQuiz = Prisma.QuizGetPayload<{ select: typeof LEARN_QUIZ_SELECT }>;

const quizNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'QUIZ_NOT_FOUND', message: 'Không tìm thấy bài quiz' });
const attemptNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'ATTEMPT_NOT_FOUND', message: 'Không tìm thấy lượt làm' });

type Db = Prisma.TransactionClient | PrismaService;
type LearnQuestion = Prisma.QuestionGetPayload<{ select: typeof QUESTION_SELECT }>;

const ATTEMPT_SELECT = { id: true, attemptNo: true, questionIds: true, shuffle: true } satisfies Prisma.QuizAttemptSelect;

// Câu của một lượt theo đúng thứ tự đã chụp lúc bắt đầu, kể cả câu đã archive.
// `known` = câu đang hoạt động đã tải sẵn → thường không tốn thêm query.
async function attemptQuestions(db: Db, quizId: string, ids: string[], known: LearnQuestion[]): Promise<LearnQuestion[]> {
  const byId = new Map(known.map((q) => [q.id, q]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) {
    const rows = await db.question.findMany({ where: { quizId, id: { in: missing } }, select: QUESTION_SELECT });
    for (const q of rows) byId.set(q.id, q);
  }
  return ids.flatMap((id) => byId.get(id) ?? []);
}

// Đáp án xáo theo seed attemptId + questionId → resume/xem lại cùng thứ tự mà không phải lưu.
function shuffleOptions<Q extends { id: string; options: O[] }, O>(questions: Q[], shuffle: boolean, attemptId: string): Q[] {
  return shuffle ? questions.map((q) => ({ ...q, options: seededShuffle(q.options, attemptId + q.id) })) : questions;
}

// Học viên làm quiz. Không @Roles, kiểm ghi danh ở đây.
@Injectable()
export class LearnQuizService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(slug: string, userId: string, itemId: string) {
    const [{ quiz }, attempts] = await Promise.all([
      this.load(slug, userId, itemId),
      // Lọc theo itemId để chạy song song với load (chưa có quizId); load lỗi thì kết quả này bỏ.
      isGuid(itemId)
        ? this.prisma.quizAttempt.findMany({
            where: { userId, quiz: { itemId } },
            orderBy: { submittedAt: { sort: 'desc', nulls: 'last' } },
            select: { id: true, attemptNo: true, status: true, scorePct: true, passed: true, submittedAt: true },
          })
        : [],
    ]);
    const submitted = attempts
      .filter((a) => a.status === 'submitted')
      .map((a) => ({ id: a.id, attemptNo: a.attemptNo, scorePct: Number(a.scorePct), passed: !!a.passed, submittedAt: a.submittedAt! }));
    return {
      itemId,
      title: quiz.item.title,
      description: quiz.description,
      passScorePct: quiz.passScorePct,
      questionCount: quiz.questions.length,
      topics: quiz.topics.map((t) => t.topic),
      passed: submitted.some((a) => a.passed),
      bestScorePct: submitted.length ? Math.max(...submitted.map((a) => a.scorePct)) : null,
      inProgressAttemptId: attempts.find((a) => a.status === 'in_progress')?.id ?? null,
      attempts: submitted,
    };
  }

  async start(slug: string, userId: string, itemId: string) {
    const { quiz, enrollment } = await this.load(slug, userId, itemId);
    const attempt = await this.prisma.$transaction(async (tx) => {
      // Khoá dòng enrollment → 2 request start song song không tạo 2 attempt / trùng attemptNo.
      await tx.$queryRaw`SELECT id FROM enrollments WHERE id = ${enrollment.id}::uuid FOR UPDATE`;
      // Khoá chia sẻ dòng khoá học: xung đột với FOR UPDATE của GV khi sửa câu → GV không đếm "chưa có lượt nào"
      // rồi sửa đè câu đúng lúc lượt mới được tạo; các lượt start không chặn nhau.
      await tx.$queryRaw`SELECT 1 FROM courses WHERE id = ${quiz.courseId}::uuid FOR SHARE`;
      const open = await tx.quizAttempt.findFirst({
        where: { quizId: quiz.id, userId, status: 'in_progress' },
        select: ATTEMPT_SELECT,
      });
      if (open) return open;
      const { _max } = await tx.quizAttempt.aggregate({ where: { quizId: quiz.id, userId }, _max: { attemptNo: true } });
      const ids = quiz.questions.map((q) => q.id);
      return tx.quizAttempt.create({
        data: {
          quizId: quiz.id,
          userId,
          attemptNo: (_max.attemptNo ?? 0) + 1,
          // Thứ tự câu được lưu vào lượt nên seed chỉ cần ngẫu nhiên.
          questionIds: quiz.shuffle ? seededShuffle(ids, randomUUID()) : ids,
          passScorePct: quiz.passScorePct,
          shuffle: quiz.shuffle,
        },
        select: ATTEMPT_SELECT,
      });
    }, TX_OPTIONS);
    const questions = await attemptQuestions(this.prisma, quiz.id, attempt.questionIds, quiz.questions);
    return {
      attemptId: attempt.id,
      attemptNo: attempt.attemptNo,
      questions: shuffleOptions(questions, attempt.shuffle, attempt.id).map((q) => ({
        id: q.id,
        type: q.type,
        stem: q.stem,
        options: q.options.map((o) => ({ id: o.id, content: o.content })),
      })),
    };
  }

  async submit(slug: string, userId: string, itemId: string, attemptId: string, body: SubmitInput) {
    const { quiz, enrollment } = await this.load(slug, userId, itemId, false);
    if (!isGuid(attemptId)) throw attemptNotFound();
    await this.prisma.$transaction(async (tx) => {
      const [attempt] = await tx.$queryRaw<
        { userId: string; quizId: string; status: string; startedAt: Date; questionIds: string[]; passScorePct: number }[]
      >`
        SELECT "userId", "quizId", status, "startedAt", "questionIds", "passScorePct"
        FROM quiz_attempts WHERE id = ${attemptId}::uuid FOR UPDATE`;
      if (!attempt || attempt.userId !== userId || attempt.quizId !== quiz.id) throw attemptNotFound();
      if (attempt.status !== 'in_progress') {
        throw new ConflictException({ statusCode: 409, code: 'ATTEMPT_SUBMITTED', message: 'Lượt làm này đã nộp' });
      }
      const now = new Date();
      const questions = await attemptQuestions(tx, quiz.id, attempt.questionIds, quiz.questions);
      const graded = grade(questions, body.answers);
      const passed = graded.scorePct >= attempt.passScorePct;
      await tx.quizAnswer.createMany({ data: graded.answers.map((a) => ({ ...a, attemptId, answeredAt: now })) });
      await tx.quizAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'submitted',
          submittedAt: now,
          scorePct: graded.scorePct,
          passed,
          timeSpentSec: Math.max(0, Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000)),
        },
      });

      await recomputeMastery(tx, userId, quiz.topics.map((t) => t.topic.id));
      if (passed) await completeItem(tx, enrollment.id, quiz.courseId, itemId, now);
    }, SUBMIT_TX);
    return this.buildResult(quiz, userId, attemptId);
  }

  async result(slug: string, userId: string, itemId: string, attemptId: string) {
    const { quiz } = await this.load(slug, userId, itemId, false);
    if (!isGuid(attemptId)) throw attemptNotFound();
    return this.buildResult(quiz, userId, attemptId);
  }

  private async buildResult(quiz: LearnQuiz, userId: string, attemptId: string) {
    const [attempt, mastery, passedCount] = await Promise.all([
      this.prisma.quizAttempt.findFirst({
        where: { id: attemptId, userId, quizId: quiz.id, status: 'submitted' },
        select: {
          id: true,
          attemptNo: true,
          scorePct: true,
          passed: true,
          timeSpentSec: true,
          questionIds: true,
          passScorePct: true,
          shuffle: true,
          answers: { select: { questionId: true, selectedOptionIds: true, isCorrect: true } },
        },
      }),
      this.prisma.userTopicMastery.findMany({
        where: { userId, topicId: { in: quiz.topics.map((t) => t.topic.id) } },
        select: { topicId: true, score: true },
      }),
      this.prisma.quizAttempt.count({ where: { userId, quizId: quiz.id, passed: true } }),
    ]);
    if (!attempt) throw attemptNotFound();
    // Chưa đạt lần nào → chỉ báo câu đúng/sai, giấu đáp án đúng + giải thích (không chép đáp án để đạt).
    const answersRevealed = passedCount > 0;
    const answerOf = new Map(attempt.answers.map((a) => [a.questionId, a]));
    const rows = (await attemptQuestions(this.prisma, quiz.id, attempt.questionIds, quiz.questions)).map((q) => ({
      ...q,
      selectedOptionIds: answerOf.get(q.id)?.selectedOptionIds ?? [],
      isCorrect: answerOf.get(q.id)?.isCorrect ?? false,
    }));
    return {
      attemptId: attempt.id,
      attemptNo: attempt.attemptNo,
      scorePct: Number(attempt.scorePct),
      passed: !!attempt.passed,
      passScorePct: attempt.passScorePct,
      correctCount: rows.filter((r) => r.isCorrect).length,
      total: rows.length,
      timeSpentSec: attempt.timeSpentSec ?? 0,
      answersRevealed,
      topics: quiz.topics.map(({ topic }) => ({
        ...topic,
        masteryPct: Math.round(Number(mastery.find((m) => m.topicId === topic.id)?.score ?? 0) * 100),
      })),
      questions: shuffleOptions(rows, attempt.shuffle, attempt.id).map((q) => ({
        id: q.id,
        type: q.type,
        stem: q.stem,
        isCorrect: q.isCorrect,
        selectedOptionIds: q.selectedOptionIds,
        relatedItem: q.relatedItem,
        options: answersRevealed
          ? q.options
          : q.options.map(({ id, content }) => ({ id, content, isCorrect: null, explanation: null })),
      })),
    };
  }

  // Quiz trước ghi danh (404 trước 403); 2 query chạy song song (DB xa).
  // strict = quiz đang xuất bản và còn câu (overview, start). Nộp / xem kết quả của lượt đã có
  // chỉ cần quiz còn thuộc khoá — GV gỡ hết câu thì lượt cũ vẫn dùng đề đã chụp.
  private async load(slug: string, userId: string, itemId: string, strict = true) {
    if (!isGuid(itemId)) throw quizNotFound();
    const [quiz, enrollment] = await Promise.all([
      this.prisma.quiz.findFirst({
        where: { itemId, item: { type: 'quiz', ...(strict && { isPublished: true }) }, course: { slug } },
        select: LEARN_QUIZ_SELECT,
      }),
      this.prisma.enrollment.findFirst({ where: { userId, course: { slug } }, select: { id: true, completedAt: true } }),
    ]);
    if (!quiz || (strict && !quiz.questions.length)) throw quizNotFound();
    if (!enrollment) {
      throw new ForbiddenException({ statusCode: 403, code: 'NOT_ENROLLED', message: 'Bạn chưa ghi danh khoá học này' });
    }
    return { quiz, enrollment };
  }
}
