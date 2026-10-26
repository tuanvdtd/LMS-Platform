import { HttpException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { CurriculumService } from '../curriculum/curriculum.service.js';
import { PrismaService } from '../infra/prisma.service.js';
import { RedisService, rateLimit } from '../infra/redis.js';
import { CodeRunner, LANGUAGES, RunnerUnavailableError, type Language } from './code-runner.js';
import type { UpdateCodeInput, UpdateExerciseInput } from './exercise.schemas.js';
import { runTests } from './grading.js';

type Tx = Prisma.TransactionClient;

const EXERCISE_SELECT = {
  instructions: true,
  hints: true,
  difficulty: true,
  learningObjective: true,
  solutionExplanation: true,
  relatedItemId: true,
  languages: true,
  updatedAt: true,
  item: { select: { title: true, isPublished: true } },
  topics: { select: { topicId: true }, orderBy: { topicId: 'asc' } },
  starters: { select: { language: true, code: true, solutionCode: true }, orderBy: { language: 'asc' } },
  testCases: {
    orderBy: { position: 'asc' },
    select: { id: true, position: true, input: true, expectedOutput: true, isPublic: true, points: true },
  },
} satisfies Prisma.ExerciseSelect;

function toDetail({ item, topics, testCases, languages, starters, ...e }: Prisma.ExerciseGetPayload<{ select: typeof EXERCISE_SELECT }>) {
  return {
    ...e,
    title: item.title,
    isPublished: item.isPublished,
    topicIds: topics.map((t) => t.topicId),
    languages: languages as Language[],
    starters: starters.map((s) => ({ ...s, language: s.language as Language })),
    tests: testCases,
  };
}

export const tooManyRequests = () =>
  new HttpException({ statusCode: 429, code: 'RATE_LIMITED', message: 'Bạn thao tác quá nhanh, thử lại sau ít phút' }, 429);
export const runnerUnavailable = () =>
  new ServiceUnavailableException({ statusCode: 503, code: 'RUNNER_UNAVAILABLE', message: 'Hệ thống chạy code đang bận, thử lại sau' });

// Mỗi user chỉ 1 lần chạy Piston đồng bộ cùng lúc (không để 1 người chiếm hết slot). TTL > thời gian chạy tối đa 1 lượt.
export async function withRunLock<T>(redis: RedisService, userId: string, fn: () => Promise<T>): Promise<T> {
  const key = `lock:exercise-run:${userId}`;
  if (!(await redis.set(key, '1', 'EX', 300, 'NX'))) throw tooManyRequests();
  try {
    return await fn();
  } finally {
    await redis.del(key);
  }
}

// Lời giải mẫu phải chạy ≤ 70% mốc CPU: chừa chỗ cho cách giải hơi chậm hơn của học viên và dao động khi Piston bận.
// Đổi → sửa cả VERIFY_BUDGET_PCT ở it-course-platform/src/types/exercise.ts.
const VERIFY_BUDGET = 0.7;
const verifyBudgetMs = (language: Language) => Math.round(LANGUAGES[language].cpuLimitMs * VERIFY_BUDGET);

// Soạn bài code. Ghi qua CurriculumService.mutate → trả { exercise }.
@Injectable()
export class ExerciseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly curriculum: CurriculumService,
    private readonly runner: CodeRunner,
    private readonly redis: RedisService,
  ) {}

  async get(courseId: string, userId: string, itemId: string) {
    const ex =
      isGuid(courseId) && isGuid(itemId)
        ? await this.prisma.exercise.findFirst({
            where: { itemId, courseId, course: { instructorId: userId } },
            select: EXERCISE_SELECT,
          })
        : null;
    if (!ex) throw new NotFoundException();
    return toDetail(ex);
  }

  update(courseId: string, userId: string, itemId: string, body: UpdateExerciseInput) {
    return this.write(courseId, userId, itemId, async (tx, exerciseId) => {
      const { topicIds, ...fields } = body;
      if (fields.relatedItemId) {
        const ok = await tx.curriculumItem.count({ where: { id: fields.relatedItemId, courseId, type: 'lecture' } });
        if (!ok) throw validationError([{ path: ['relatedItemId'], message: 'Bài giảng liên quan không hợp lệ' }]);
      }
      if (topicIds) {
        const inCourse = await tx.courseTopic.count({ where: { courseId, topicId: { in: topicIds } } });
        if (inCourse < topicIds.length) throw validationError([{ path: ['topicIds'], message: 'Chủ đề không thuộc khoá học' }]);
        await tx.exerciseTopic.deleteMany({ where: { exerciseId } });
        await tx.exerciseTopic.createMany({ data: topicIds.map((topicId) => ({ exerciseId, topicId })) });
      }
      await tx.exercise.update({ where: { id: exerciseId }, data: fields });
    });
  }

  updateCode(courseId: string, userId: string, itemId: string, body: UpdateCodeInput) {
    return this.write(courseId, userId, itemId, async (tx, exerciseId) => {
      const existing = new Set(
        (await tx.exerciseTestCase.findMany({ where: { exerciseId }, select: { id: true } })).map((t) => t.id),
      );
      const unknown = body.tests.findIndex((t) => t.id && !existing.has(t.id));
      if (unknown >= 0) throw validationError([{ path: ['tests', String(unknown), 'id'], message: 'Test không tồn tại' }]);
      const kept = body.tests.flatMap((t, position) => (t.id ? [{ ...t, id: t.id, position }] : []));
      const added = body.tests.flatMap(({ id, ...t }, position) => (id ? [] : [{ ...t, exerciseId, position }]));
      // Test giữ id → kết quả nộp cũ vẫn trỏ đúng; test bị bỏ xoá kéo theo kết quả của nó.
      await tx.exerciseTestCase.deleteMany({ where: { exerciseId, id: { notIn: kept.map((t) => t.id) } } });
      // Unique (exerciseId, position) không DEFERRABLE → đẩy sang âm rồi ghi vị trí mới trong một câu (DB xa).
      await tx.$executeRaw`UPDATE exercise_test_cases SET position = -1 - position WHERE "exerciseId" = ${exerciseId}::uuid`;
      if (kept.length) {
        await tx.$executeRaw`
          UPDATE exercise_test_cases t
          SET input = v.input, "expectedOutput" = v.expected, "isPublic" = v.pub, points = v.points, position = v.pos
          FROM unnest(${kept.map((t) => t.id)}::uuid[], ${kept.map((t) => t.input)}::text[],
            ${kept.map((t) => t.expectedOutput)}::text[], ${kept.map((t) => t.isPublic)}::boolean[],
            ${kept.map((t) => t.points)}::int[], ${kept.map((t) => t.position)}::int[])
            AS v(id, input, expected, pub, points, pos)
          WHERE t.id = v.id`;
      }
      if (added.length) await tx.exerciseTestCase.createMany({ data: added });
      await tx.exerciseStarterCode.deleteMany({ where: { exerciseId } });
      await tx.exerciseStarterCode.createMany({ data: body.starters.map((s) => ({ ...s, exerciseId })) });
      await tx.exercise.update({ where: { id: exerciseId }, data: { languages: body.languages } });
      // Đụng code/test → phải verify lại mới xuất bản.
      await tx.curriculumItem.update({ where: { id: itemId }, data: { isPublished: false } });
    });
  }

  async verify(courseId: string, userId: string, itemId: string) {
    if (!(await rateLimit(this.redis, `rl:exercise-verify:${userId}`, 10, 60))) throw tooManyRequests();
    const ex = await this.get(courseId, userId, itemId);
    const problems: string[] = [];
    if (!ex.tests.length) problems.push('Cần ít nhất 1 test');
    else if (!ex.tests.some((t) => t.isPublic)) problems.push('Cần ít nhất 1 test công khai để học viên chạy thử');
    const solutions = ex.languages.map((language) => ({
      language,
      code: ex.starters.find((s) => s.language === language)?.solutionCode?.trim() ?? '',
    }));
    for (const s of solutions) if (!s.code) problems.push(`Thiếu lời giải ${LANGUAGES[s.language].label}`);
    if (problems.length) return { passed: false, problems, languages: [] };

    let languages;
    try {
      // Các ngôn ngữ chạy song song, test trong một ngôn ngữ tuần tự.
      languages = await withRunLock(this.redis, userId, () =>
        Promise.all(
          solutions.map(async ({ language, code }) => {
            const { compileError, results } = await runTests(this.runner.run.bind(this.runner), language, code, ex.tests);
            return {
              language,
              compileError,
              tests: results.map((r) => ({
                testCaseId: r.testCaseId,
                status: r.status,
                stdout: r.run.stdout,
                timeMs: r.run.timeMs,
                slow: r.status === 'accepted' && r.run.timeMs !== null && r.run.timeMs > verifyBudgetMs(language),
              })),
            };
          }),
        ),
      );
    } catch (err) {
      if (err instanceof RunnerUnavailableError) throw runnerUnavailable();
      throw err;
    }
    // Số test 1-based theo thứ tự ex.tests (position), khớp cột STT ở báo cáo của giảng viên.
    for (const l of languages) {
      const nos = l.tests.flatMap((t, i) => (t.slow ? [i + 1] : []));
      if (nos.length) {
        problems.push(
          `Lời giải ${LANGUAGES[l.language].label} chạy quá sát giới hạn ở test ${nos.join(', ')} ` +
            `(tối đa ${verifyBudgetMs(l.language).toLocaleString('vi-VN')} ms) — giảm kích thước test hoặc tối ưu lời giải`,
        );
      }
    }
    const passed = languages.every(
      (l) =>
        !l.compileError && l.tests.length === ex.tests.length && l.tests.every((t) => t.status === 'accepted' && !t.slow),
    );
    if (!passed) return { passed, problems, languages };
    let stale = false;
    await this.curriculum.mutate(courseId, userId, async (tx) => {
      const cur = await tx.exercise.findFirst({ where: { itemId, courseId }, select: { updatedAt: true } });
      // Bị sửa trong lúc chạy (Piston chạy ngoài transaction) → không xuất bản kết quả cũ.
      if (cur?.updatedAt.getTime() !== ex.updatedAt.getTime()) {
        stale = true;
        return;
      }
      await tx.curriculumItem.update({ where: { id: itemId }, data: { isPublished: true } });
    });
    return stale
      ? { passed: false, problems: ['Bài vừa bị sửa trong lúc kiểm tra, hãy kiểm tra lại'], languages }
      : { passed, problems, languages };
  }

  private async write(courseId: string, userId: string, itemId: string, fn: (tx: Tx, exerciseId: string) => Promise<void>) {
    await this.curriculum.mutate(courseId, userId, async (tx) => {
      const found = isGuid(itemId) ? await tx.exercise.findFirst({ where: { itemId, courseId }, select: { id: true } }) : null;
      if (!found) throw new NotFoundException();
      await fn(tx, found.id);
    });
    return { exercise: await this.get(courseId, userId, itemId) };
  }
}
