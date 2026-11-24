import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isGuid } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { AnalyticsCoursesService, exerciseNotFound, quizNotFound } from './analytics-courses.service.js';
import { exerciseStats } from './exercise-stats.js';
import { groupBy, r1, r3 } from './helpers.js';
import { analyzeItems, firstAttempts, ITEM_MIN_N, summarizeAttempts, type ItemAnswer } from './item-analysis.js';

const ACTIVE_QUESTIONS = {
  where: { archivedAt: null },
  orderBy: { position: 'asc' },
  select: {
    id: true,
    position: true,
    type: true,
    stem: true,
    relatedItem: { select: { id: true, title: true } },
    options: { orderBy: { position: 'asc' }, select: { id: true, content: true, isCorrect: true } },
  },
} satisfies Prisma.Quiz$questionsArgs;

type Attempt = { userId: string; attemptNo: number; scorePct: number; passed: boolean; answers: ItemAnswer[] };
type Ordered = { item: { position: number; section: { position: number } } };
const byCurriculum = (a: Ordered, b: Ordered) => a.item.section.position - b.item.section.position || a.item.position - b.item.position;

// Chất lượng quiz + bài code. Câu đã sửa khi có người làm được archive + tạo id mới (quiz.service) → số liệu mỗi câu
// luôn thuộc đúng một phiên bản; chỉ phân tích câu đang hoạt động.
// ponytail: tính lại mỗi lần mở trang; khoá cỡ chục nghìn lượt làm thì cache Redis theo courseId.
@Injectable()
export class AssessmentsAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: AnalyticsCoursesService,
  ) {}

  async overview(courseId: string, instructorId: string) {
    await this.courses.owned(courseId, instructorId);
    const [quizzes, exercises] = await Promise.all([
      this.prisma.quiz.findMany({
        where: { courseId },
        select: {
          id: true,
          itemId: true,
          item: { select: { title: true, position: true, section: { select: { title: true, position: true } } } },
          questions: ACTIVE_QUESTIONS,
        },
      }),
      this.prisma.exercise.findMany({
        where: { courseId },
        select: {
          id: true,
          itemId: true,
          item: { select: { title: true, position: true, section: { select: { position: true } } } },
          testCases: { select: { id: true, position: true, isPublic: true } },
        },
      }),
    ]);
    const [attempts, submissions] = await Promise.all([this.attempts(quizzes.map((q) => q.id), instructorId), this.submissions({ exercise: { courseId }, userId: { not: instructorId } })]);
    return {
      minSample: ITEM_MIN_N,
      quizzes: quizzes.sort(byCurriculum).map((q) => {
        const list = attempts.get(q.id) ?? [];
        const s = summarizeAttempts(list);
        const items = analyzeItems(q.questions, firstAttempts(list).map((a) => a.answers));
        return {
          quizId: q.id,
          itemId: q.itemId,
          title: q.item.title,
          sectionTitle: q.item.section.title,
          questionCount: q.questions.length,
          learners: s.n,
          firstAttempt: { n: s.n, meanPct: r1(s.meanPct), medianPct: r1(s.medianPct), passRatePct: r1(s.passRateFirstPct) },
          finalPassRatePct: r1(s.passRateFinalPct),
          avgAttemptsToPass: r1(s.avgAttemptsToPass),
          flagged: { fix: items.filter((i) => i.status === 'fix').length, review: items.filter((i) => i.status === 'review').length },
        };
      }),
      exercises: exercises.sort(byCurriculum).map((e) => {
        const s = exerciseStats(e.testCases, submissions.get(e.id) ?? []);
        return {
          exerciseId: e.id,
          itemId: e.itemId,
          title: e.item.title,
          learners: s.learners,
          passRatePct: r1(s.passRatePct),
          avgSubmissionsToPass: r1(s.avgSubmissionsToPass),
          stuck: s.stuck,
          verdicts: s.verdicts,
        };
      }),
    };
  }

  async quiz(quizId: string, instructorId: string) {
    const quiz = isGuid(quizId)
      ? await this.prisma.quiz.findFirst({
          where: { id: quizId, course: { instructorId } },
          select: { id: true, itemId: true, courseId: true, passScorePct: true, item: { select: { title: true } }, questions: ACTIVE_QUESTIONS },
        })
      : null;
    if (!quiz) throw quizNotFound();
    const list = (await this.attempts([quiz.id], instructorId)).get(quiz.id) ?? [];
    const s = summarizeAttempts(list);
    const stats = analyzeItems(quiz.questions, firstAttempts(list).map((a) => a.answers));
    return {
      minSample: ITEM_MIN_N,
      quiz: { id: quiz.id, itemId: quiz.itemId, courseId: quiz.courseId, title: quiz.item.title, passScorePct: quiz.passScorePct },
      summary: {
        n: s.n,
        meanPct: r1(s.meanPct),
        medianPct: r1(s.medianPct),
        passRateFirstPct: r1(s.passRateFirstPct),
        passRateFinalPct: r1(s.passRateFinalPct),
        avgAttemptsToPass: r1(s.avgAttemptsToPass),
      },
      histogram: s.histogram,
      questions: quiz.questions.map((q, i) => {
        const st = stats[i];
        return {
          id: q.id,
          position: q.position,
          type: q.type,
          stem: q.stem,
          relatedItem: q.relatedItem,
          n: st.n,
          p: r3(st.p),
          d: r3(st.d),
          dSe: r3(st.dSe),
          pUpper: r3(st.pUpper),
          pLower: r3(st.pLower),
          options: q.options.map((o, k) => ({
            id: o.id,
            content: o.content,
            isCorrect: o.isCorrect,
            pickedCount: st.options[k].pickedCount,
            pickedPct: r1(100 * st.options[k].pickedRate),
          })),
          status: st.status,
          flags: st.flags,
        };
      }),
    };
  }

  async exercise(exerciseId: string, instructorId: string) {
    const ex = isGuid(exerciseId)
      ? await this.prisma.exercise.findFirst({
          where: { id: exerciseId, course: { instructorId } },
          select: {
            id: true,
            itemId: true,
            courseId: true,
            difficulty: true,
            item: { select: { title: true } },
            testCases: { select: { id: true, position: true, isPublic: true } },
          },
        })
      : null;
    if (!ex) throw exerciseNotFound();
    const s = exerciseStats(ex.testCases, (await this.submissions({ exerciseId: ex.id, userId: { not: instructorId } })).get(ex.id) ?? []);
    return {
      exercise: { id: ex.id, itemId: ex.itemId, courseId: ex.courseId, title: ex.item.title, difficulty: ex.difficulty },
      summary: {
        learners: s.learners,
        passed: s.passed,
        passRatePct: r1(s.passRatePct),
        avgSubmissionsToPass: r1(s.avgSubmissionsToPass),
        stuck: s.stuck,
        submissions: s.submissions,
      },
      verdicts: s.verdicts,
      tests: s.tests.map((t) => ({ ...t, failRatePct: r1(t.failRatePct) })),
    };
  }

  // Mọi lượt ĐÃ NỘP kèm đáp án, gom theo quiz (đáp án chỉ dùng cho lượt đầu; lớp vài trăm người tải hết vẫn nhẹ).
  private async attempts(quizIds: string[], instructorId: string): Promise<Map<string, Attempt[]>> {
    const rows = await this.prisma.quizAttempt.findMany({
      where: { quizId: { in: quizIds }, status: 'submitted', userId: { not: instructorId } },
      select: {
        quizId: true,
        userId: true,
        attemptNo: true,
        scorePct: true,
        passed: true,
        answers: { select: { questionId: true, selectedOptionIds: true, isCorrect: true, pointsAwarded: true } },
      },
    });
    const list = rows.map((r) => ({
      quizId: r.quizId,
      userId: r.userId,
      attemptNo: r.attemptNo,
      scorePct: Number(r.scorePct ?? 0),
      passed: r.passed ?? false,
      answers: r.answers,
    }));
    return groupBy(list, (a) => a.quizId);
  }

  private async submissions(where: Prisma.SubmissionWhereInput) {
    const rows = await this.prisma.submission.findMany({
      where,
      select: { exerciseId: true, userId: true, status: true, submittedAt: true, results: { select: { testCaseId: true, status: true } } },
    });
    return groupBy(rows, (r) => r.exerciseId);
  }
}
