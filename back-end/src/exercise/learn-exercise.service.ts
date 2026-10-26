import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';
import type { Options } from 'amqplib';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { RedisService, rateLimit } from '../infra/redis.js';
import { CodeRunner, RunnerUnavailableError, type Language } from './code-runner.js';
import { runnerUnavailable, tooManyRequests, withRunLock } from './exercise.service.js';
import { excerpt, runTests } from './grading.js';
import type { CodeInput } from './learn-exercise.schemas.js';

// Thiếu timeout thì publish lúc mất kết nối bị buffer trong RAM (xem mail.service.ts).
const PUBLISH: Options.Publish & { timeout: number } = { persistent: true, timeout: 5_000 };
const GRADED: Prisma.EnumSubmissionStatusFilter = { notIn: ['pending', 'running', 'internal_error'] };

const LEARN_SELECT = {
  id: true,
  instructions: true,
  difficulty: true,
  learningObjective: true,
  languages: true,
  hints: true,
  solutionExplanation: true,
  item: { select: { title: true } },
  relatedItem: { select: { id: true, title: true, isPublished: true } },
  topics: { select: { topic: { select: { id: true, name: true } } } },
  starters: { select: { language: true, code: true, solutionCode: true } },
  testCases: { orderBy: { position: 'asc' }, select: { id: true, input: true, expectedOutput: true, isPublic: true } },
} satisfies Prisma.ExerciseSelect;
type LearnRow = Prisma.ExerciseGetPayload<{ select: typeof LEARN_SELECT }>;

const SUMMARY_SELECT = {
  id: true,
  language: true,
  status: true,
  score: true,
  passedTests: true,
  totalTests: true,
  submittedAt: true,
  gradedAt: true,
} satisfies Prisma.SubmissionSelect;

const exerciseNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'EXERCISE_NOT_FOUND', message: 'Không tìm thấy bài tập' });
const submissionNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'SUBMISSION_NOT_FOUND', message: 'Không tìm thấy bài nộp' });

// Học viên làm bài code. Không @Roles, kiểm ghi danh ở đây.
@Injectable()
export class LearnExerciseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: CodeRunner,
    private readonly redis: RedisService,
    private readonly amqp: AmqpConnection,
  ) {}

  async overview(slug: string, userId: string, itemId: string) {
    const ex = await this.load(slug, userId, itemId);
    const [best, accepted] = await Promise.all([
      this.prisma.submission.aggregate({ where: { exerciseId: ex.id, userId, status: GRADED }, _max: { score: true } }),
      this.prisma.submission.count({ where: { exerciseId: ex.id, userId, status: 'accepted' } }),
    ]);
    return {
      itemId,
      title: ex.item.title,
      instructions: ex.instructions,
      difficulty: ex.difficulty,
      learningObjective: ex.learningObjective,
      topics: ex.topics.map((t) => t.topic),
      relatedItem: ex.relatedItem?.isPublished ? { id: ex.relatedItem.id, title: ex.relatedItem.title } : null,
      languages: ex.languages as Language[],
      starters: Object.fromEntries(ex.starters.map((s) => [s.language, s.code])),
      publicTests: ex.testCases.filter((t) => t.isPublic).map(({ id, input, expectedOutput }) => ({ id, input, expectedOutput })),
      hiddenTestCount: ex.testCases.filter((t) => !t.isPublic).length,
      hints: ex.hints,
      completed: accepted > 0,
      bestScore: best._max.score,
      // Lời giải chỉ hiện khi đã accepted.
      solution: accepted
        ? {
            codes: Object.fromEntries(ex.starters.flatMap((s) => (s.solutionCode ? [[s.language, s.solutionCode]] : []))),
            explanation: ex.solutionExplanation,
          }
        : null,
    };
  }

  async run(slug: string, userId: string, itemId: string, body: CodeInput) {
    const ex = await this.load(slug, userId, itemId);
    this.checkLanguage(ex, body.language);
    if (!(await rateLimit(this.redis, `rl:exercise-run:${userId}`, 10, 60))) throw tooManyRequests();
    const tests = ex.testCases.filter((t) => t.isPublic);
    try {
      const { compileError, results } = await withRunLock(this.redis, userId, () =>
        runTests(this.runner.run.bind(this.runner), body.language, body.sourceCode, tests),
      );
      return {
        compileError: compileError === null ? null : excerpt(compileError),
        tests: results.map((r, i) => ({
          testCaseId: r.testCaseId,
          input: tests[i].input,
          expectedOutput: tests[i].expectedOutput,
          stdout: excerpt(r.run.stdout),
          stderr: excerpt(r.run.stderr),
          status: r.status,
          timeMs: r.run.timeMs,
        })),
      };
    } catch (err) {
      if (err instanceof RunnerUnavailableError) throw runnerUnavailable();
      throw err;
    }
  }

  async submit(slug: string, userId: string, itemId: string, body: CodeInput) {
    const ex = await this.load(slug, userId, itemId);
    this.checkLanguage(ex, body.language);
    let id: string;
    try {
      id = await this.prisma.$transaction(async (tx) => {
        // Bài kẹt quá 5 phút của chính mình → nhả suất đang chấm.
        await tx.$executeRaw`
          UPDATE submissions SET status = 'internal_error', "gradedAt" = now()
          WHERE "userId" = ${userId}::uuid AND status IN ('pending', 'running')
            AND "submittedAt" < now() - interval '5 minutes'`;
        const s = await tx.submission.create({
          data: { exerciseId: ex.id, userId, language: body.language, sourceCode: body.sourceCode, totalTests: ex.testCases.length },
          select: { id: true },
        });
        return s.id;
      }, TX_OPTIONS);
    } catch (err) {
      // uq_submissions_inflight_user: đang có bài chờ chấm (có thể ở bài / khoá khác) → FE theo dõi bài đó.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const open = await this.prisma.submission.findFirst({
          where: { userId, status: { in: ['pending', 'running'] } },
          select: { id: true, exercise: { select: { itemId: true, course: { select: { slug: true } } } } },
        });
        throw new ConflictException({
          statusCode: 409,
          code: 'SUBMISSION_IN_PROGRESS',
          message: 'Bạn đang có một bài chờ chấm',
          submissionId: open?.id ?? null,
          itemId: open?.exercise.itemId ?? null,
          courseSlug: open?.exercise.course.slug ?? null,
        });
      }
      throw err;
    }
    try {
      await this.amqp.publish('', 'submission.grade', { submissionId: id, attempt: 1 }, PUBLISH);
    } catch (err) {
      Sentry.captureException(err, { tags: { queue: 'submission.grade' } });
      await this.prisma.submission.update({ where: { id }, data: { status: 'internal_error', gradedAt: new Date() } });
      throw new ServiceUnavailableException({ statusCode: 503, code: 'GRADER_UNAVAILABLE', message: 'Hệ thống chấm đang bận, thử lại sau' });
    }
    return { id };
  }

  async submissions(slug: string, userId: string, itemId: string) {
    const ex = await this.load(slug, userId, itemId);
    return this.prisma.submission.findMany({
      where: { exerciseId: ex.id, userId },
      orderBy: { submittedAt: 'desc' },
      take: 20,
      select: SUMMARY_SELECT,
    });
  }

  async submission(slug: string, userId: string, itemId: string, submissionId: string) {
    const ex = await this.load(slug, userId, itemId);
    const s = isGuid(submissionId)
      ? await this.prisma.submission.findFirst({
          where: { id: submissionId, userId, exerciseId: ex.id },
          select: {
            ...SUMMARY_SELECT,
            sourceCode: true,
            compileError: true,
            maxTimeMs: true,
            maxMemoryKb: true,
            results: {
              orderBy: { testCase: { position: 'asc' } },
              select: {
                testCaseId: true,
                status: true,
                timeMs: true,
                stdoutExcerpt: true,
                stderrExcerpt: true,
                testCase: { select: { position: true, isPublic: true, input: true, expectedOutput: true } },
              },
            },
          },
        })
      : null;
    if (!s) throw submissionNotFound();
    const { results, ...rest } = s;
    return {
      ...rest,
      // Test ẩn không trả input/output/stdout — kể cả stderr (thông báo lỗi có thể lộ input).
      results: results.map(({ testCase: t, stdoutExcerpt, stderrExcerpt, ...r }) =>
        t.isPublic
          ? { ...r, position: t.position, isPublic: true, input: t.input, expectedOutput: t.expectedOutput, stdout: stdoutExcerpt ?? '', stderr: stderrExcerpt ?? '' }
          : { ...r, position: t.position, isPublic: false },
      ),
    };
  }

  private checkLanguage(ex: LearnRow, language: Language) {
    if (!ex.languages.includes(language)) {
      throw validationError([{ path: ['language'], message: 'Bài này không dùng ngôn ngữ đã chọn' }]);
    }
  }

  // Bài trước ghi danh (404 trước 403); 2 query song song (DB xa).
  private async load(slug: string, userId: string, itemId: string) {
    if (!isGuid(itemId)) throw exerciseNotFound();
    const [ex, enrollment] = await Promise.all([
      this.prisma.exercise.findFirst({
        where: { itemId, item: { type: 'coding_exercise', isPublished: true }, course: { slug } },
        select: LEARN_SELECT,
      }),
      this.prisma.enrollment.findFirst({ where: { userId, course: { slug } }, select: { id: true } }),
    ]);
    if (!ex) throw exerciseNotFound();
    if (!enrollment) {
      throw new ForbiddenException({ statusCode: 403, code: 'NOT_ENROLLED', message: 'Bạn chưa ghi danh khoá học này' });
    }
    return ex;
  }
}
