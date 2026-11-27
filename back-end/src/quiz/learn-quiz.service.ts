import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isGuid } from '../common/zod.pipe.js';
import { completeItem } from '../curriculum/progress.js';
import { PrismaService } from '../infra/prisma.service.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { ownerEnrollment } from '../learn/enrollment.js';
import { grade, seededShuffle } from './grading.js';
import type { AnswersInput } from './learn-quiz.schemas.js';
import { ATTEMPT_WINDOW_MS, attemptQuota, deadlineOf, isOverdue, remainingSec } from './quiz-limits.js';

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
  itemId: true,
  courseId: true,
  passScorePct: true,
  shuffle: true,
  timeLimitMin: true,
  maxAttempts: true,
  course: { select: { instructorId: true } },
  description: true,
  item: { select: { title: true } },
  questions: { where: { archivedAt: null }, orderBy: { position: 'asc' }, select: QUESTION_SELECT },
} satisfies Prisma.QuizSelect;
type LearnQuiz = Prisma.QuizGetPayload<{ select: typeof LEARN_QUIZ_SELECT }>;

const quizNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'QUIZ_NOT_FOUND', message: 'Không tìm thấy bài quiz' });
const attemptNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'ATTEMPT_NOT_FOUND', message: 'Không tìm thấy lượt làm' });

type Db = Prisma.TransactionClient | PrismaService;
type LearnQuestion = Prisma.QuestionGetPayload<{ select: typeof QUESTION_SELECT }>;

const ATTEMPT_SELECT = {
  id: true,
  attemptNo: true,
  questionIds: true,
  shuffle: true,
  startedAt: true,
  timeLimitMin: true,
} satisfies Prisma.QuizAttemptSelect;

const attemptSubmitted = () =>
  new ConflictException({ statusCode: 409, code: 'ATTEMPT_SUBMITTED', message: 'Lượt làm này đã nộp' });

type LockedAttempt = {
  id: string;
  userId: string;
  quizId: string;
  status: string;
  startedAt: Date;
  questionIds: string[];
  passScorePct: number;
  timeLimitMin: number | null;
};

// Khoá dòng lượt: lưu câu, nộp bài và đóng lượt quá hạn chạy lần lượt, không lưu được sau khi đã chấm.
async function lockAttempt(tx: Prisma.TransactionClient, id: string): Promise<LockedAttempt | undefined> {
  const rows = await tx.$queryRaw<LockedAttempt[]>`
    SELECT id, "userId", "quizId", status, "startedAt", "questionIds", "passScorePct", "timeLimitMin"
    FROM quiz_attempts WHERE id = ${id}::uuid FOR UPDATE`;
  return rows[0];
}

// Ghi đáp án nháp (chưa chấm). 2 query bất kể số câu — DB ở xa, mỗi query ~1-2s.
async function writeAnswers(tx: Prisma.TransactionClient, attemptId: string, answers: AnswersInput['answers'], now: Date) {
  if (!answers.length) return;
  await tx.quizAnswer.deleteMany({ where: { attemptId, questionId: { in: answers.map((a) => a.questionId) } } });
  const rows = answers
    .filter((a) => a.optionIds.length)
    .map((a) => ({ attemptId, questionId: a.questionId, selectedOptionIds: [...new Set(a.optionIds)], isCorrect: null, answeredAt: now }));
  if (rows.length) await tx.quizAnswer.createMany({ data: rows });
}

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
    const { quiz, enrollment } = await this.load(slug, userId, itemId);
    await this.closeOverdue(quiz, enrollment.id, userId);
    const [attempts, quota] = await Promise.all([
      this.prisma.quizAttempt.findMany({
        where: { userId, quizId: quiz.id },
        orderBy: { submittedAt: { sort: 'desc', nulls: 'last' } },
        select: { id: true, attemptNo: true, status: true, scorePct: true, passed: true, submittedAt: true },
      }),
      this.quota(quiz, userId),
    ]);
    const submitted = attempts
      .filter((a) => a.status === 'submitted')
      .map((a) => ({ id: a.id, attemptNo: a.attemptNo, scorePct: Number(a.scorePct), passed: !!a.passed, submittedAt: a.submittedAt! }));
    return {
      itemId,
      title: quiz.item.title,
      description: quiz.description,
      passScorePct: quiz.passScorePct,
      timeLimitMin: quiz.timeLimitMin,
      maxAttempts: quiz.maxAttempts,
      ...quota,
      questionCount: quiz.questions.length,
      passed: submitted.some((a) => a.passed),
      bestScorePct: submitted.length ? Math.max(...submitted.map((a) => a.scorePct)) : null,
      inProgressAttemptId: attempts.find((a) => a.status === 'in_progress')?.id ?? null,
      attempts: submitted,
    };
  }

  async start(slug: string, userId: string, itemId: string) {
    const { quiz, enrollment } = await this.load(slug, userId, itemId);
    await this.closeOverdue(quiz, enrollment.id, userId);
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
      if (open) return open; // làm tiếp lượt dở không tính lượt mới
      const { attemptsLeft, nextAttemptAt } = await this.quota(quiz, userId, tx);
      if (attemptsLeft === 0) {
        throw new ConflictException({ statusCode: 409, code: 'ATTEMPT_LIMIT', message: 'Bạn đã dùng hết lượt làm bài', nextAttemptAt });
      }
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
          timeLimitMin: quiz.timeLimitMin,
        },
        select: ATTEMPT_SELECT,
      });
    }, TX_OPTIONS);
    const [questions, saved] = await Promise.all([
      attemptQuestions(this.prisma, quiz.id, attempt.questionIds, quiz.questions),
      this.prisma.quizAnswer.findMany({ where: { attemptId: attempt.id }, select: { questionId: true, selectedOptionIds: true } }),
    ]);
    return {
      attemptId: attempt.id,
      attemptNo: attempt.attemptNo,
      // Trong khoảng dư sau hạn vẫn trả lượt với 0 giây → trang tự nộp ngay.
      remainingSec: remainingSec(deadlineOf(attempt.startedAt, attempt.timeLimitMin), new Date()),
      savedAnswers: saved.map((a) => ({ questionId: a.questionId, optionIds: a.selectedOptionIds })),
      questions: shuffleOptions(questions, attempt.shuffle, attempt.id).map((q) => ({
        id: q.id,
        type: q.type,
        stem: q.stem,
        options: q.options.map((o) => ({ id: o.id, content: o.content })),
      })),
    };
  }

  async saveAnswers(slug: string, userId: string, itemId: string, attemptId: string, body: AnswersInput) {
    const { quiz, enrollment } = await this.load(slug, userId, itemId, false);
    if (!isGuid(attemptId)) throw attemptNotFound();
    // Hết giờ: đóng + chấm trong transaction rồi mới ném 409 ở ngoài — ném bên trong sẽ rollback việc chấm.
    const out = await this.prisma.$transaction(async (tx) => {
      const a = await lockAttempt(tx, attemptId);
      if (!a || a.userId !== userId || a.quizId !== quiz.id) throw attemptNotFound();
      if (a.status !== 'in_progress') throw attemptSubmitted();
      const now = new Date();
      const deadline = deadlineOf(a.startedAt, a.timeLimitMin);
      if (isOverdue(deadline, now)) {
        await this.finalize(tx, quiz, enrollment.id, a, 'timeout');
        return null;
      }
      const inAttempt = new Set(a.questionIds);
      if (body.answers.some((x) => !inAttempt.has(x.questionId))) {
        throw new BadRequestException({ statusCode: 400, code: 'QUESTION_NOT_IN_ATTEMPT', message: 'Câu hỏi không thuộc lượt làm này' });
      }
      await writeAnswers(tx, attemptId, body.answers, now);
      return { remainingSec: remainingSec(deadline, now) };
    }, SUBMIT_TX);
    if (!out) throw new ConflictException({ statusCode: 409, code: 'ATTEMPT_EXPIRED', message: 'Đã hết giờ làm bài' });
    return out;
  }

  async submit(slug: string, userId: string, itemId: string, attemptId: string, body: AnswersInput) {
    const { quiz, enrollment } = await this.load(slug, userId, itemId, false);
    if (!isGuid(attemptId)) throw attemptNotFound();
    const certificateSerial = await this.prisma.$transaction(async (tx) => {
      const a = await lockAttempt(tx, attemptId);
      if (!a || a.userId !== userId || a.quizId !== quiz.id) throw attemptNotFound();
      if (a.status !== 'in_progress') throw attemptSubmitted();
      const now = new Date();
      const overdue = isOverdue(deadlineOf(a.startedAt, a.timeLimitMin), now);
      // Quá hạn + khoảng dư → bỏ đáp án gửi kèm, chỉ chấm phần đã lưu trước hạn.
      // Câu ngoài đề bị bỏ qua (không 400) — nộp bài vẫn dễ tính như trước.
      if (!overdue) {
        const inAttempt = new Set(a.questionIds);
        await writeAnswers(tx, attemptId, body.answers.filter((x) => inAttempt.has(x.questionId)), now);
      }
      return this.finalize(tx, quiz, enrollment.id, a, overdue ? 'timeout' : 'submit');
    }, SUBMIT_TX);
    return { ...(await this.buildResult(quiz, userId, attemptId)), certificateSerial };
  }

  async result(slug: string, userId: string, itemId: string, attemptId: string) {
    const { quiz, enrollment } = await this.load(slug, userId, itemId, false);
    if (!isGuid(attemptId)) throw attemptNotFound();
    await this.closeOverdue(quiz, enrollment.id, userId);
    return { ...(await this.buildResult(quiz, userId, attemptId)), certificateSerial: null };
  }

  // Chấm từ các dòng đã lưu. Dùng cho nộp bài và đóng lượt hết giờ; dòng lượt phải đang bị khoá.
  // Hết giờ: submittedAt = hạn nộp → màn kết quả nhận ra lượt bị tự nộp.
  private async finalize(
    tx: Prisma.TransactionClient,
    quiz: LearnQuiz,
    enrollmentId: string,
    a: LockedAttempt,
    mode: 'submit' | 'timeout',
  ) {
    const end = mode === 'timeout' ? deadlineOf(a.startedAt, a.timeLimitMin)! : new Date();
    const saved = await tx.quizAnswer.findMany({
      where: { attemptId: a.id },
      select: { questionId: true, selectedOptionIds: true, answeredAt: true },
    });
    const questions = await attemptQuestions(tx, quiz.id, a.questionIds, quiz.questions);
    const graded = grade(questions, saved.map((x) => ({ questionId: x.questionId, optionIds: x.selectedOptionIds })));
    const answeredAt = new Map(saved.map((x) => [x.questionId, x.answeredAt]));
    // Ghi lại toàn bộ: lượt đã nộp có đủ 1 dòng/câu (câu bỏ trống = dòng rỗng, sai), giữ giờ trả lời từng câu.
    await tx.quizAnswer.deleteMany({ where: { attemptId: a.id } });
    await tx.quizAnswer.createMany({
      data: graded.answers.map((g) => ({ ...g, attemptId: a.id, answeredAt: answeredAt.get(g.questionId) ?? end })),
    });
    const passed = graded.scorePct >= a.passScorePct;
    await tx.quizAttempt.update({
      where: { id: a.id },
      data: {
        status: 'submitted',
        submittedAt: end,
        scorePct: graded.scorePct,
        passed,
        timeSpentSec: Math.max(0, Math.round((end.getTime() - a.startedAt.getTime()) / 1000)),
      },
    });
    return passed ? completeItem(tx, enrollmentId, quiz.courseId, quiz.itemId, end) : null;
  }

  // Lượt hết giờ mà học viên đã rời trang: đóng khi có request đụng tới quiz này (không cần cron).
  // Transaction riêng, chạy trước transaction khoá enrollment của start() để không lệch thứ tự khoá.
  private async closeOverdue(quiz: LearnQuiz, enrollmentId: string, userId: string) {
    const open = await this.prisma.quizAttempt.findFirst({
      where: { quizId: quiz.id, userId, status: 'in_progress', timeLimitMin: { not: null } },
      select: { id: true, startedAt: true, timeLimitMin: true },
    });
    if (!open || !isOverdue(deadlineOf(open.startedAt, open.timeLimitMin), new Date())) return;
    await this.prisma.$transaction(async (tx) => {
      const a = await lockAttempt(tx, open.id);
      if (a?.status === 'in_progress') await this.finalize(tx, quiz, enrollmentId, a, 'timeout'); // có thể vừa được nộp
    }, SUBMIT_TX);
  }

  // Chủ khoá tự làm thử không bị giới hạn số lượt.
  private async quota(quiz: LearnQuiz, userId: string, db: Db = this.prisma) {
    if (quiz.maxAttempts == null || quiz.course.instructorId === userId) return { attemptsLeft: null, nextAttemptAt: null };
    const now = new Date();
    const rows = await db.quizAttempt.findMany({
      where: { quizId: quiz.id, userId, startedAt: { gt: new Date(now.getTime() - ATTEMPT_WINDOW_MS) } },
      select: { startedAt: true },
    });
    return attemptQuota(quiz.maxAttempts, rows.map((r) => r.startedAt), now);
  }

  private async buildResult(quiz: LearnQuiz, userId: string, attemptId: string) {
    const [attempt, passedCount, quota] = await Promise.all([
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
          startedAt: true,
          submittedAt: true,
          timeLimitMin: true,
          answers: { select: { questionId: true, selectedOptionIds: true, isCorrect: true } },
        },
      }),
      this.prisma.quizAttempt.count({ where: { userId, quizId: quiz.id, passed: true } }),
      this.quota(quiz, userId),
    ]);
    if (!attempt) throw attemptNotFound();
    // Hết giờ = nộp không sớm hơn hạn (máy chủ tự đóng, hoặc trang tự nộp lúc đồng hồ về 0).
    const deadline = deadlineOf(attempt.startedAt, attempt.timeLimitMin);
    const timedOut = deadline != null && attempt.submittedAt != null && attempt.submittedAt >= deadline;
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
      timedOut,
      ...quota,
      answersRevealed,
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
    const [quiz, found] = await Promise.all([
      this.prisma.quiz.findFirst({
        where: { itemId, item: { type: 'quiz', ...(strict && { isPublished: true }) }, course: { slug } },
        select: LEARN_QUIZ_SELECT,
      }),
      this.prisma.enrollment.findFirst({ where: { userId, course: { slug } }, select: { id: true, completedAt: true } }),
    ]);
    if (!quiz || (strict && !quiz.questions.length)) throw quizNotFound();
    const enrollment = found ?? (await ownerEnrollment(this.prisma, slug, userId, { completedAt: true }));
    if (!enrollment) {
      throw new ForbiddenException({ statusCode: 403, code: 'NOT_ENROLLED', message: 'Bạn chưa ghi danh khoá học này' });
    }
    return { quiz, enrollment };
  }
}
