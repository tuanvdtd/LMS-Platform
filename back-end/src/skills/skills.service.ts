import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { type AttemptStatus, Prisma } from '@prisma/client';
import { isGuid } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { seededShuffle } from '../quiz/grading.js';
import * as elo from './skill-elo.js';
import type { AnswerInput } from './skills.schemas.js';

type Db = Prisma.TransactionClient | PrismaService;
// Một câu trả lời ~8 query trong transaction; DB dev ~1–2 s/query → 15 s của TX_OPTIONS không đủ (như SUBMIT_TX của quiz).
const TX = { ...TX_OPTIONS, timeout: 60_000 };

const topicNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'SKILL_TOPIC_NOT_FOUND', message: 'Topic này chưa có bài đánh giá' });
const attemptNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'SKILL_ATTEMPT_NOT_FOUND', message: 'Không tìm thấy lượt làm bài' });
const staleQuestion = () =>
  new ConflictException({ statusCode: 409, code: 'SKILL_STALE_QUESTION', message: 'Câu hỏi đã thay đổi, hãy tải lại bài' });

type TopicRef = { slug: string; name: string };
export type AttemptState =
  | {
      state: 'question'; attemptId: string; topic: TopicRef; position: number; total: number; deadlineAt: string; now: string;
      question: { id: string; type: 'single_choice' | 'multiple_choice'; stem: string; options: { id: string; content: string }[] };
    }
  | {
      state: 'result'; attemptId: string; topic: TopicRef; status: 'submitted' | 'expired'; startedAt: string; finishedAt: string;
      pctBefore: number | null; pctAfter: number; ratingBefore: number; ratingAfter: number; answered: number; correct: number;
      items: { position: number; stem: string; isCorrect: boolean | null; skipped: boolean }[];
    };

// Học viên làm bài đánh giá kỹ năng. Không @Roles: mọi user đăng nhập (staff bị AuthGuard chặn như route học viên khác).
@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: string) {
    await this.closeExpired(this.prisma, userId);
    const counts = await this.prisma.skillQuestion.groupBy({ by: ['topicId'], where: { archivedAt: null }, _count: { _all: true } });
    const open = counts.filter((c) => c._count._all >= elo.MIN_ACTIVE_QUESTIONS).map((c) => c.topicId);
    const [profile, topics, skills, attempts] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { occupation: true, level: true } }),
      this.prisma.topic.findMany({
        where: { id: { in: open } },
        orderBy: { name: 'asc' },
        select: { id: true, slug: true, name: true, prerequisites: { where: { id: { in: open } }, select: { id: true } } },
      }),
      this.prisma.userTopicSkill.findMany({ where: { userId, topicId: { in: open } } }),
      this.prisma.skillAttempt.findMany({
        where: { userId, topicId: { in: open } },
        orderBy: { startedAt: 'asc' },
        select: {
          id: true, topicId: true, status: true, startedAt: true, finishedAt: true, ratingAfter: true, ratingBefore: true,
          _count: { select: { answers: { where: { answeredAt: { not: null } } } } },
        },
      }),
    ]);
    const now = Date.now();
    const skillOf = new Map(skills.map((s) => [s.topicId, s]));
    return {
      profile,
      topics: topics.map((t) => {
        const s = skillOf.get(t.id);
        const next = s ? elo.nextAvailableAt(s.lastStartedAt) : null;
        // Đang làm dở: báo số liệu từ trước lượt này, không lộ đúng/sai từng câu qua % đổi theo câu.
        const cur = attempts.find((a) => a.topicId === t.id && a.status === 'in_progress');
        const answerCount = s ? s.answerCount - (cur?._count.answers ?? 0) : 0;
        const rating = cur ? cur.ratingBefore : s?.rating;
        return {
          id: t.id, slug: t.slug, name: t.name,
          pct: rating !== undefined && answerCount > 0 ? elo.masteryPct(rating) : null,
          answerCount,
          nextAvailableAt: next && next.getTime() > now ? next.toISOString() : null,
          inProgressAttemptId: cur?.id ?? null,
        };
      }),
      history: attempts
        .filter((a) => a.status !== 'in_progress' && a._count.answers > 0)
        .map((a) => ({ topicId: a.topicId, at: a.finishedAt!.toISOString(), pct: elo.masteryPct(a.ratingAfter!) })),
      edges: topics.flatMap((t) => t.prerequisites.map((p) => ({ topicId: t.id, requiresId: p.id }))),
    };
  }

  async start(userId: string, topicSlug: string): Promise<AttemptState> {
    const topic = await this.prisma.topic.findUnique({ where: { slug: topicSlug }, select: { id: true } });
    if (!topic) throw topicNotFound();
    const active = await this.prisma.skillQuestion.count({ where: { topicId: topic.id, archivedAt: null } });
    if (active < elo.MIN_ACTIVE_QUESTIONS) throw topicNotFound();
    let attemptId: string;
    try {
      attemptId = await this.prisma.$transaction(async (tx) => {
        await this.closeExpired(tx, userId, topic.id);
        const current = await tx.skillAttempt.findFirst({
          where: { userId, topicId: topic.id, status: 'in_progress' }, select: { id: true },
        });
        if (current) return current.id;
        const key = { userId_topicId: { userId, topicId: topic.id } };
        const skill = await tx.userTopicSkill.findUnique({ where: key });
        if (skill) {
          const next = elo.nextAvailableAt(skill.lastStartedAt);
          if (next.getTime() > Date.now()) {
            throw new ConflictException({
              statusCode: 409, code: 'SKILL_COOLDOWN', message: 'Bạn vừa làm bài này, hãy quay lại sau', nextAvailableAt: next.toISOString(),
            });
          }
        }
        const rating = skill?.rating ?? elo.START_RATING;
        const startedAt = new Date();
        await tx.userTopicSkill.upsert({
          where: key, create: { userId, topicId: topic.id, rating, lastStartedAt: startedAt }, update: { lastStartedAt: startedAt },
        });
        const attempt = await tx.skillAttempt.create({
          data: { userId, topicId: topic.id, ratingBefore: rating, startedAt }, select: { id: true },
        });
        await this.serveNext(tx, attempt.id, userId, topic.id, rating, 1);
        return attempt.id;
      }, TX);
    } catch (e) {
      // 2 request song song: uq_skill_attempt_in_progress / PK user_topic_skills chặn request sau → trả lượt của request trước.
      const isRace = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
      const winner = isRace
        ? await this.prisma.skillAttempt.findFirst({ where: { userId, topicId: topic.id, status: 'in_progress' }, select: { id: true } })
        : null;
      if (!winner) throw e;
      attemptId = winner.id;
    }
    return this.state(userId, attemptId);
  }

  async get(userId: string, attemptId: string): Promise<AttemptState> {
    const a = isGuid(attemptId)
      ? await this.prisma.skillAttempt.findFirst({ where: { id: attemptId, userId }, select: { id: true, status: true, startedAt: true } })
      : null;
    if (!a) throw attemptNotFound();
    // Xem sau hạn → đóng ngay (không chờ grace: grace chỉ để nhận câu gửi sát hạn).
    if (a.status === 'in_progress' && Date.now() > elo.deadlineOf(a.startedAt).getTime()) await this.finish(this.prisma, a.id, 'expired');
    return this.state(userId, attemptId);
  }

  async answer(userId: string, attemptId: string, body: AnswerInput): Promise<AttemptState> {
    if (!isGuid(attemptId)) throw attemptNotFound();
    await this.prisma.$transaction(async (tx) => {
      // Khoá dòng lượt trước khi đọc status: GET/overview đóng lượt hết hạn ngoài tx, không khoá thì có thể đóng khi câu
      // trả lời trong grace chưa commit → ratingAfter thiếu câu đó. Có khoá, finish bên ngoài chờ rồi updateMany (lọc status) 0 dòng.
      await tx.$queryRaw`SELECT id FROM skill_attempts WHERE id = ${attemptId}::uuid AND "userId" = ${userId}::uuid FOR UPDATE`;
      const attempt = await tx.skillAttempt.findFirst({
        where: { id: attemptId, userId }, select: { id: true, topicId: true, status: true, startedAt: true },
      });
      if (!attempt) throw attemptNotFound();
      if (attempt.status !== 'in_progress') return; // đã xong → trả kết quả
      const deadline = elo.deadlineOf(attempt.startedAt).getTime();
      if (Date.now() > deadline + elo.GRACE_MS) return this.finish(tx, attempt.id, 'expired'); // câu này không tính

      const current = await tx.skillAnswer.findFirst({
        where: { attemptId, answeredAt: null },
        select: {
          id: true, position: true,
          question: { select: { id: true, rating: true, answerCount: true, options: { select: { id: true, isCorrect: true } } } },
        },
      });
      if (!current || current.question.id !== body.questionId) throw staleQuestion();
      const ids = new Set(current.question.options.map((o) => o.id));
      if (!body.optionIds.every((id) => ids.has(id))) {
        throw new BadRequestException({ statusCode: 400, code: 'SKILL_BAD_OPTION', message: 'Đáp án không hợp lệ' });
      }

      const key = { userId_topicId: { userId, topicId: attempt.topicId } };
      const skill = await tx.userTopicSkill.findUniqueOrThrow({ where: key });
      const q = current.question;
      const correct = elo.isCorrectAnswer(q.options, body.optionIds);
      const r = elo.rate(skill.rating, q.rating, correct, skill.answerCount, q.answerCount);
      // answeredAt IS NULL: gửi đôi → request sau 0 dòng → 409.
      const { count } = await tx.skillAnswer.updateMany({
        where: { id: current.id, answeredAt: null },
        data: {
          answeredAt: new Date(), selectedOptionIds: [...new Set(body.optionIds)], isCorrect: correct, skipped: !body.optionIds.length,
          userRatingBefore: skill.rating, userRatingAfter: r.user, questionRatingBefore: q.rating, questionRatingAfter: r.question,
        },
      });
      if (!count) throw staleQuestion();
      await tx.userTopicSkill.update({ where: key, data: { rating: r.user, answerCount: { increment: 1 } } });
      // ponytail: delta tính từ R vừa đọc; 2 người trả lời cùng câu đúng cùng lúc thì lệch nhỏ — cần chính xác thì SELECT … FOR UPDATE.
      await tx.skillQuestion.update({
        where: { id: q.id },
        data: { rating: { increment: r.question - q.rating }, answerCount: { increment: 1 }, correctCount: { increment: correct ? 1 : 0 } },
      });

      if (Date.now() > deadline) return this.finish(tx, attempt.id, 'expired'); // trả lời trong grace: tính câu này rồi đóng
      const more =
        current.position < elo.QUESTIONS_PER_ATTEMPT &&
        (await this.serveNext(tx, attempt.id, userId, attempt.topicId, r.user, current.position + 1));
      if (!more) await this.finish(tx, attempt.id, 'submitted');
    }, TX);
    return this.state(userId, attemptId);
  }

  // Phát câu kế tiếp = tạo dòng skill_answers chưa trả lời. false = hết câu để phát.
  private async serveNext(db: Db, attemptId: string, userId: string, topicId: string, rUser: number, position: number) {
    const [questions, seen, inAttempt] = await Promise.all([
      db.skillQuestion.findMany({ where: { topicId, archivedAt: null }, select: { id: true, rating: true } }),
      db.skillAnswer.groupBy({ by: ['questionId'], where: { attempt: { userId, topicId } }, _max: { servedAt: true } }),
      db.skillAnswer.findMany({ where: { attemptId }, select: { questionId: true } }),
    ]);
    const lastSeen = new Map(seen.map((s) => [s.questionId, s._max.servedAt!.getTime()]));
    const used = new Set(inAttempt.map((a) => a.questionId));
    const id = elo.pickNext(
      rUser,
      questions.filter((q) => !used.has(q.id)).map((q) => ({ id: q.id, rating: q.rating, lastSeenAt: lastSeen.get(q.id) ?? null })),
      Math.random,
    );
    if (!id) return false;
    await db.skillAnswer.create({ data: { attemptId, questionId: id, position } });
    return true;
  }

  // Đóng lười lượt quá hạn ở mọi lối vào (khỏi cần cron).
  private async closeExpired(db: Db, userId: string, topicId?: string) {
    const stale = await db.skillAttempt.findMany({
      where: { userId, status: 'in_progress', startedAt: { lt: new Date(Date.now() - elo.TIME_LIMIT_MS) }, ...(topicId && { topicId }) },
      select: { id: true },
    });
    for (const a of stale) await this.finish(db, a.id, 'expired');
  }

  // ratingAfter = R sau câu trả lời cuối; chưa trả lời câu nào thì = ratingBefore. Lọc theo status → gọi lặp vô hại.
  private async finish(db: Db, attemptId: string, status: Exclude<AttemptStatus, 'in_progress'>) {
    const [attempt, last] = await Promise.all([
      db.skillAttempt.findUniqueOrThrow({ where: { id: attemptId }, select: { ratingBefore: true, startedAt: true } }),
      db.skillAnswer.findFirst({
        where: { attemptId, answeredAt: { not: null } }, orderBy: { position: 'desc' }, select: { userRatingAfter: true },
      }),
    ]);
    await db.skillAttempt.updateMany({
      where: { id: attemptId, status: 'in_progress' },
      // Hết giờ: ghi mốc hạn chứ không phải lúc đóng lười (khỏi lệch ngày lịch sử / thời lượng).
      data: { status, finishedAt: status === 'expired' ? elo.deadlineOf(attempt.startedAt) : new Date(), ratingAfter: last?.userRatingAfter ?? attempt.ratingBefore },
    });
  }

  private async state(userId: string, attemptId: string): Promise<AttemptState> {
    const a = await this.prisma.skillAttempt.findFirstOrThrow({
      where: { id: attemptId, userId },
      select: {
        id: true, topicId: true, status: true, startedAt: true, finishedAt: true, ratingBefore: true, ratingAfter: true,
        topic: { select: { slug: true, name: true } },
        answers: {
          orderBy: { position: 'asc' },
          select: {
            position: true, answeredAt: true, isCorrect: true, skipped: true,
            question: {
              select: { id: true, type: true, stem: true, options: { orderBy: { position: 'asc' }, select: { id: true, content: true } } },
            },
          },
        },
      },
    });
    if (a.status === 'in_progress') {
      const cur = a.answers.find((x) => !x.answeredAt);
      if (!cur) {
        // Không xảy ra (lượt mở luôn có câu đang hiện) — đóng cho khỏi kẹt.
        await this.finish(this.prisma, a.id, 'submitted');
        return this.state(userId, attemptId);
      }
      return {
        state: 'question', attemptId: a.id, topic: a.topic, position: cur.position, total: elo.QUESTIONS_PER_ATTEMPT,
        deadlineAt: elo.deadlineOf(a.startedAt).toISOString(), now: new Date().toISOString(),
        // Xáo đáp án theo seed attemptId + questionId → F5 vẫn cùng thứ tự (như quiz).
        question: { ...cur.question, options: seededShuffle(cur.question.options, a.id + cur.question.id) },
      };
    }
    const answered = a.answers.filter((x) => x.answeredAt);
    const prior = await this.prisma.skillAnswer.count({
      where: { answeredAt: { not: null }, attempt: { userId, topicId: a.topicId, startedAt: { lt: a.startedAt } } },
    });
    return {
      state: 'result', attemptId: a.id, topic: a.topic, status: a.status as 'submitted' | 'expired',
      startedAt: a.startedAt.toISOString(), finishedAt: a.finishedAt!.toISOString(),
      pctBefore: prior > 0 ? elo.masteryPct(a.ratingBefore) : null, pctAfter: elo.masteryPct(a.ratingAfter!),
      ratingBefore: Math.round(a.ratingBefore), ratingAfter: Math.round(a.ratingAfter!),
      answered: answered.length, correct: answered.filter((x) => x.isCorrect).length,
      items: a.answers.map((x) => ({ position: x.position, stem: x.question.stem, isCorrect: x.answeredAt ? x.isCorrect : null, skipped: x.skipped })),
    };
  }
}
