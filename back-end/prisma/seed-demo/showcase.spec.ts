import { exerciseStats } from '../../src/analytics/exercise-stats.ts';
import { analyzeItems, firstAttempts } from '../../src/analytics/item-analysis.ts';
import { assessRisk } from '../../src/analytics/risk.ts';
import { topicGain } from '../../src/analytics/skill-gain.ts';
import { masteryPct } from '../../src/skills/skill-elo.ts';
import { SHOWCASE } from './data/analytics-demo.ts';
import { SEED_DATA } from './data/index.ts';
import { DAY, mulberry32 } from './rng.ts';
import { computeRetention } from '../../src/analytics/video-retention.ts';
import { planWatching } from './watching.ts';
import { planShowcase, planShowcaseLearners } from './showcase.ts';
import { planSkillHistory } from './skills.ts';

// Kiểm chứng dashboard: chạy đúng planner của seed rồi đưa thẳng vào hàm phân tích của BE, khẳng định các lỗi cài sẵn
// được phát hiện (cùng tinh thần đo gợi ý bằng Precision@K). Không cần DB.
const now = new Date('2026-11-21T00:00:00Z');
const c = SEED_DATA.courses.find((x) => x.title === SHOWCASE.courseTitle)!;
let seq = 0;
const id = () => `id-${++seq}`;
const quiz = {
  id: id(), itemId: id(), passScorePct: 70,
  questions: c.quiz.questions.map((q) => ({ id: id(), type: q.type, points: 1, options: q.options.map((o) => ({ id: id(), isCorrect: !!o.correct })) })),
};
const ex = c.exercise!;
const exercise = {
  id: id(), itemId: id(), language: ex.code[0].language, starter: ex.code[0].starter, solution: ex.code[0].solution,
  tests: ex.tests.map((_, i) => ({ id: id(), position: i, points: 10 })),
};
const lectures = c.sections.flatMap((s) => s.lectures).map(() => ({ id: id(), durationSec: 600 }));
const items = [...lectures, { id: quiz.itemId, durationSec: 0 }, { id: exercise.itemId, durationSec: 0 }];
const rng = mulberry32(20261102 + 2);
const learners = planShowcaseLearners(rng, {
  now, publishedAt: new Date(now.getTime() - SHOWCASE.publishedDaysAgo * DAY), count: SHOWCASE.learners, mix: SHOWCASE.personaMix,
}).map((l, i) => ({ ...l, userId: `u${i}` }));
const plan = planShowcase(rng, {
  now, course: { id: 'course', items, quiz, exercise }, learners,
  params: SHOWCASE.questions, bugs: SHOWCASE.bugs, exerciseB: SHOWCASE.exerciseB, gainRating: SHOWCASE.gainRating, id,
});
const firsts = firstAttempts(plan.attempts);

describe('khoá trình diễn: dashboard phát hiện đúng lỗi cài sẵn', () => {
  it('đủ cỡ mẫu: ≥ 30 lượt đầu ở quiz, ≥ 20 người nộp bài code', () => {
    expect(firsts.length).toBeGreaterThanOrEqual(30);
    expect(new Set(plan.submissions.map((s) => s.userId)).size).toBeGreaterThanOrEqual(20);
  });

  it('câu cài lỗi được gắn đúng cờ kỳ vọng; không câu thường nào bị "Cần sửa"', () => {
    const stats = analyzeItems(quiz.questions, firsts.map((a) => a.answers));
    SHOWCASE.questions.forEach((p, i) => {
      const codes = stats[i].flags.map((f) => f.code);
      for (const code of p.expect ?? []) expect(codes, `câu ${i + 1}`).toContain(code);
      if (!p.expect) expect(stats[i].status, `câu ${i + 1}`).not.toBe('fix');
    });
  });

  it('test rớt nhiều nhất là test ẩn cài sẵn', () => {
    const tests = exercise.tests.map((t) => ({ id: t.id, position: t.position, isPublic: ex.tests[t.position].isPublic }));
    const s = exerciseStats(tests, plan.submissions);
    const worst = [...s.tests].sort((a, b) => (b.failRatePct ?? 0) - (a.failRatePct ?? 0))[0];
    expect(worst).toMatchObject({ position: SHOWCASE.hardestTestPosition, isPublic: false });
  });

  it('mức high khớp persona bỏ ngang (precision, recall ≥ 0.8); finisher là done; steady không high', () => {
    const risks = assessRisk(now, plan.enrollments.map((e) => ({
      userId: e.userId, enrolledAt: e.at, progressPct: e.progressPct, lastAccessedAt: e.lastAccessedAt, completedAt: e.completedAt,
      quizzes: firsts.filter((a) => a.userId === e.userId).map((a) => ({ scorePct: a.scorePct, passScorePct: a.passScorePct })),
    })));
    const high = [...risks].filter(([, r]) => r.level === 'high').map(([u]) => u);
    const dropped = [...plan.personas].filter(([, p]) => p === 'stalled' || p === 'ghost').map(([u]) => u);
    const hit = high.filter((u) => dropped.includes(u)).length;
    expect(hit / dropped.length).toBeGreaterThanOrEqual(0.8);
    expect(hit / high.length).toBeGreaterThanOrEqual(0.8);
    for (const [u, p] of plan.personas) {
      if (p === 'finisher') expect(risks.get(u)!.level).toBe('done');
      if (p === 'steady') expect(risks.get(u)!.level).not.toBe('high');
    }
  });

  it('topic javascript: ≥ 20 cặp trước/sau ghi danh, g mức trung bình', () => {
    const pool = Array.from({ length: 60 }, (_, i) => ({ id: `q${i}`, rating: [1050, 1200, 1350][i % 3], answerCount: 0, correctCount: 0 }));
    const sp = planSkillHistory({
      now,
      learners: plan.skill.map((s) => ({ userId: s.userId, topicId: 'js', ability: s.schedule[0].ability, schedule: s.schedule })),
      questions: new Map([['js', pool]]),
    }, mulberry32(7));
    const points = sp.attempts.map((a) => ({ userId: a.userId, at: a.finishedAt, pct: masteryPct(a.ratingAfter) }));
    const gain = topicGain(plan.enrollments.map((e) => ({ userId: e.userId, enrolledAt: e.at })), points)!;
    expect(gain.pairs).toBeGreaterThanOrEqual(20);
    expect(gain.band).toBe('medium');
  });
});

describe('khoá trình diễn: Hành vi học phát hiện mẫu cài sẵn', () => {
  const watch = planWatching(mulberry32(20261102 + 3), {
    now,
    courses: [{ id: 'course', items }],
    enrollments: plan.enrollments.map((e) => ({ id: e.id, courseId: 'course', at: e.at, completedAt: e.completedAt, lastAccessedAt: e.lastAccessedAt })),
    progress: plan.progress,
    planted: { courseId: 'course', ...SHOWCASE.video },
    id,
  });
  const videos = items.filter((x) => x.durationSec > 0);
  const ret = videos.map((v) =>
    computeRetention(v.durationSec, watch.segments.filter((s) => s.itemId === v.id).map((s) => ({
      learnerId: s.enrollmentId, viewId: s.viewId, s: s.startSec, e: s.endSec, at: s.createdAt.getTime(), seq: s.seq,
    }))),
  );

  it('đủ người xem (≥ 20) ở hai bài cài sẵn', () => {
    expect(ret[SHOWCASE.video.rewatch.videoIndex].n).toBeGreaterThanOrEqual(20);
    expect(ret[SHOWCASE.video.drop.videoIndex].n).toBeGreaterThanOrEqual(20);
  });
  it('đỉnh tua lại đúng đoạn cài sẵn (lệch ≤ 1 ô)', () => {
    const r = ret[SHOWCASE.video.rewatch.videoIndex];
    const D = videos[SHOWCASE.video.rewatch.videoIndex].durationSec;
    expect(r.peaks.length).toBeGreaterThanOrEqual(1);
    const hit = r.peaks.find((p) => p.fromSec <= D * SHOWCASE.video.rewatch.from + r.bucketSec && p.toSec >= D * SHOWCASE.video.rewatch.to - r.bucketSec);
    expect(hit).toBeDefined();
  });
  it('điểm rời bỏ đúng mốc cài sẵn', () => {
    const r = ret[SHOWCASE.video.drop.videoIndex];
    const at = videos[SHOWCASE.video.drop.videoIndex].durationSec * SHOWCASE.video.drop.at;
    expect(r.drop).not.toBeNull();
    expect(r.drop!.fromSec).toBeLessThanOrEqual(at + SHOWCASE.video.drop.jitterSec);
    expect(r.drop!.toSec).toBeGreaterThanOrEqual(at - SHOWCASE.video.drop.jitterSec);
  });
  it('các bài video khác không có đỉnh / điểm rời bỏ', () => {
    ret.forEach((r, i) => {
      if (i === SHOWCASE.video.rewatch.videoIndex || i === SHOWCASE.video.drop.videoIndex) return;
      expect(r.peaks, `video ${i}`).toEqual([]);
      expect(r.drop, `video ${i}`).toBeNull();
    });
  });
});
