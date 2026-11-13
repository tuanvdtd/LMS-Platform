import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type { SubmissionStatus } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';
import type { Options } from 'amqplib';
import { z } from 'zod';
import { completeItem } from '../curriculum/progress.js';
import { optionalEnv } from '../env.js';
import { PrismaService } from '../infra/prisma.service.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';
import { SUBMISSION_CHANNEL, SUBMISSION_QUEUES } from '../infra/rabbit.module.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { CodeRunner, type Language } from './code-runner.js';
import { excerpt, notificationBody, runTests, summarize } from './grading.js';

const PERSISTENT: Options.Publish = { persistent: true };
const MAX_ATTEMPTS = 3;
// completeItem + notification + ghi kết quả ~10 query; DB dev ~1-2s/query.
const GRADE_TX = { ...TX_OPTIONS, timeout: 60_000 };
const jobSchema = z.object({ submissionId: z.guid(), attempt: z.int().min(1) });

const SUBMISSION_SELECT = {
  id: true,
  userId: true,
  language: true,
  sourceCode: true,
  status: true,
  exercise: {
    select: {
      id: true,
      courseId: true,
      itemId: true,
      item: { select: { title: true, isPublished: true } },
      course: { select: { slug: true } },
      testCases: { orderBy: { position: 'asc' }, select: { id: true, position: true, input: true, expectedOutput: true, points: true } },
    },
  },
} as const;
type Sub = NonNullable<Awaited<ReturnType<SubmissionConsumer['find']>>>;

// Đọc submission.grade → Piston → ghi kết quả + hoàn thành mục + notification.
// Piston/DB lỗi → submission.retry (tối đa 3 lần) → submission.dead + internal_error. Sentry không gửi source code.
@Injectable()
export class SubmissionConsumer implements OnApplicationBootstrap {
  private readonly log = new Logger(SubmissionConsumer.name);

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly prisma: PrismaService,
    private readonly runner: CodeRunner,
    private readonly notifications: NotificationsGateway,
  ) {}

  onApplicationBootstrap() {
    if (optionalEnv('RABBITMQ_CONSUMERS') === 'off') return;
    // Không await (xem MailConsumer): broker sập thì app vẫn lên.
    this.log.log('Đăng ký subscriber submission.grade');
    void this.amqp.createSubscriber(
      (msg) => this.handle(msg),
      { queue: 'submission.grade', queueOptions: { ...SUBMISSION_QUEUES['submission.grade'], channel: SUBMISSION_CHANNEL } },
      'submission.grade',
    );
  }

  async handle(raw: unknown): Promise<void> {
    const parsed = jobSchema.safeParse(raw);
    if (!parsed.success) {
      Sentry.captureException(parsed.error, { tags: { queue: 'submission.grade', reason: 'invalid' } });
      await this.amqp.publish('', 'submission.dead', { raw, reason: 'invalid' }, PERSISTENT);
      return;
    }
    const job = parsed.data;
    try {
      await this.grade(job.submissionId);
    } catch (err) {
      Sentry.captureException(err, { tags: { queue: 'submission.grade', attempt: job.attempt } });
      if (job.attempt < MAX_ATTEMPTS) {
        await this.amqp.publish('', 'submission.retry', { ...job, attempt: job.attempt + 1 }, PERSISTENT);
      } else {
        await this.amqp.publish('', 'submission.dead', { ...job, reason: String(err) }, PERSISTENT);
        await this.fail(job.submissionId);
      }
    }
  }

  find(submissionId: string) {
    return this.prisma.submission.findUnique({ where: { id: submissionId }, select: SUBMISSION_SELECT });
  }

  private async grade(submissionId: string) {
    const sub = await this.find(submissionId);
    // Không còn / đã chấm / đã bị đánh dấu kẹt → message giao lại, bỏ qua.
    if (!sub || (sub.status !== 'pending' && sub.status !== 'running')) return;
    const ex = sub.exercise;
    // Giảng viên sửa đề lúc bài còn trong hàng đợi → bộ test chưa verify, không chấm.
    if (!ex.item.isPublished) return this.fail(submissionId, 'Bài tập đang được cập nhật, hãy nộp lại');
    // Có điều kiện: giữa lúc đọc và ghi, nộp bài mới có thể đã đánh dấu bài kẹt này internal_error (và học viên đã có bài pending mới)
    // → update trần sẽ chạm uq_submissions_inflight_user hoặc hồi sinh bài đã chết.
    // ponytail: 2 lần giao song song cùng một job đều chạy Piston (running → running vẫn count = 1); DB chỉ ghi 1 lần nhờ FOR UPDATE. Nâng cấp: lease/token mỗi lần giao.
    const { count } = await this.prisma.submission.updateMany({
      where: { id: submissionId, status: { in: ['pending', 'running'] } },
      data: { status: 'running', totalTests: ex.testCases.length },
    });
    if (!count) return;
    const { compileError, results } = await runTests(
      this.runner.run.bind(this.runner),
      sub.language as Language,
      sub.sourceCode,
      ex.testCases,
    );
    const summary =
      compileError === null
        ? summarize(ex.testCases, results)
        : { status: 'compile_error' as SubmissionStatus, score: 0, passedTests: 0, maxTimeMs: null, maxMemoryKb: null };
    const enrollment =
      summary.status === 'accepted'
        ? await this.prisma.enrollment.findFirst({ where: { userId: sub.userId, courseId: ex.courseId }, select: { id: true } })
        : null;
    const now = new Date();
    const created = await this.prisma.$transaction(async (tx) => {
      const [row] = await tx.$queryRaw<{ status: string }[]>`
        SELECT status FROM submissions WHERE id = ${submissionId}::uuid FOR UPDATE`;
      if (row?.status !== 'running') return null; // bị đánh dấu kẹt trong lúc chấm
      await tx.submissionResult.deleteMany({ where: { submissionId } });
      await tx.submissionResult.createMany({
        data: results.map((r) => ({
          submissionId,
          testCaseId: r.testCaseId,
          status: r.status,
          timeMs: r.run.timeMs,
          memoryKb: r.run.memoryKb,
          stdoutExcerpt: excerpt(r.run.stdout),
          stderrExcerpt: excerpt(r.run.stderr),
          receivedAt: now,
        })),
      });
      await tx.submission.update({
        where: { id: submissionId },
        data: { ...summary, totalTests: ex.testCases.length, compileError: compileError === null ? null : excerpt(compileError), gradedAt: now },
      });
      const certificateSerial = enrollment ? await completeItem(tx, enrollment.id, ex.courseId, ex.itemId, now) : null;
      const n = this.notification(sub, summary.status, summary.score, summary.passedTests, ex.testCases.length);
      // Bài được chấm ở nền nên kết quả chỉ tới học viên qua thông báo này: bài vừa làm khoá hoàn thành thì
      // gửi kèm mã chứng chỉ để trang học mở lời chúc mừng.
      return tx.notification.create({ data: certificateSerial ? { ...n, data: { ...n.data, certificateSerial } } : n });
    }, GRADE_TX);
    // Đẩy sau commit: đẩy trong tx mà tx rollback thì học viên đã được báo một kết quả không tồn tại.
    if (created) this.notifications.push(created);
  }

  // Hết lượt thử → nhả suất đang chấm + báo học viên nộp lại.
  private async fail(submissionId: string, body?: string) {
    const sub = await this.find(submissionId);
    if (!sub || (sub.status !== 'pending' && sub.status !== 'running')) return;
    const created = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.submission.updateMany({
        where: { id: submissionId, status: { in: ['pending', 'running'] } },
        data: { status: 'internal_error', gradedAt: new Date() },
      });
      if (!count) return null;
      const n = this.notification(sub, 'internal_error', 0, 0, sub.exercise.testCases.length);
      return tx.notification.create({ data: body ? { ...n, body: `Bài "${sub.exercise.item.title}": ${body}` } : n });
    }, TX_OPTIONS);
    if (created) this.notifications.push(created);
  }

  private notification(sub: Sub, status: SubmissionStatus, score: number, passedTests: number, totalTests: number) {
    const ex = sub.exercise;
    return {
      userId: sub.userId,
      type: 'verdict' as const,
      title: 'Kết quả chấm bài',
      body: notificationBody(ex.item.title, status, passedTests, totalTests),
      link: `/learn/${ex.course.slug}/code/${ex.itemId}?submission=${sub.id}`,
      data: { submissionId: sub.id, status, score },
    };
  }
}
