// Khoá trình diễn cho dashboard phân tích: học viên giả lập theo persona; tiến độ, lượt quiz, bài nộp và lịch đánh giá
// kỹ năng khớp nhau. Thuần (rng có seed, id do nơi gọi cấp) → showcase.spec.ts kiểm chứng không cần DB.
import type { Occupation } from '@prisma/client';
import { progressPct } from './activity.ts';
import {
  gaussian, simulateExercise, simulateQuiz,
  type CodeRun, type ItemParam, type QuizRun, type SimAttempt, type SimBug, type SimExercise, type SimQuiz, type SimSubmission,
} from './assessment-sim.ts';
import type { SeedUser } from './data/types.ts';
import { DAY, HOUR, addMs, int, maxDate, minDate, pick, weighted, type Rng } from './rng.ts';

// finisher học xong; steady đang học đều; stuck kẹt ở quiz/bài code nhưng vẫn vào học; stalled học dở rồi nghỉ 15–90 ngày;
// ghost ghi danh lâu, chưa học bài nào; new ghi danh < 7 ngày. stalled + ghost = "thật sự bỏ ngang" để đo dashboard.
export type Persona = 'finisher' | 'steady' | 'stuck' | 'stalled' | 'ghost' | 'new';
const THETA_SHIFT: Record<Persona, number> = { finisher: 0.6, steady: 0.2, stuck: -0.5, stalled: -0.3, ghost: -0.2, new: 0 };
const OCCUPATIONS: Occupation[] = ['frontend_developer', 'fullstack_developer', 'other'];
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const DEM = ['Văn', 'Thị', 'Minh', 'Quốc', 'Thanh', 'Ngọc', 'Hoàng', 'Gia', 'Bảo', 'Khánh', 'Hải', 'Thu', 'Đức', 'Phương'];
const TEN = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hạnh', 'Hiếu', 'Hùng', 'Khoa', 'Lan', 'Linh', 'Long', 'Mai', 'Nam', 'Ngân',
  'Nhi', 'Phong', 'Phúc', 'Quân', 'Quỳnh', 'Sơn', 'Tâm', 'Thảo', 'Trang', 'Trí', 'Tú', 'Tuấn', 'Uyên', 'Vy', 'Yến', 'Khang'];

export type ShowcaseLearner = { user: SeedUser & { createdAt: Date }; persona: Persona; theta: number; enrolledAt: Date };
export type ShowcaseCourse = {
  id: string;
  items: { id: string; durationSec: number }[];
  quiz: SimQuiz & { itemId: string };
  exercise: SimExercise & { itemId: string };
};

export function planShowcaseLearners(
  rng: Rng,
  a: { now: Date; publishedAt: Date; count: number; mix: readonly (readonly [Persona, number])[] },
): ShowcaseLearner[] {
  const maxAge = (a.now.getTime() - a.publishedAt.getTime()) / DAY - 1;
  return Array.from({ length: a.count }, (_, i) => {
    const persona = weighted(rng, a.mix);
    const age =
      persona === 'new' ? 1 + rng() * 5.5
      : persona === 'ghost' ? 35 + rng() * (maxAge - 35)
      : persona === 'stalled' ? 40 + rng() * (maxAge - 40)
      : 8 + (maxAge - 8) * rng() ** 1.6; // ghi danh gần đây dày hơn
    const enrolledAt = new Date(a.now.getTime() - age * DAY);
    return {
      persona,
      theta: gaussian(rng) + THETA_SHIFT[persona],
      enrolledAt,
      user: {
        name: `${pick(rng, HO)} ${pick(rng, DEM)} ${pick(rng, TEN)}`,
        email: `hv${String(i + 1).padStart(3, '0')}@skillpath.test`,
        occupation: pick(rng, OCCUPATIONS),
        level: 'beginner',
        targetTopics: ['javascript'],
        createdAt: addMs(enrolledAt, -(5 + rng() * 35) * DAY),
      },
    };
  });
}

export function planShowcase(
  rng: Rng,
  a: {
    now: Date; course: ShowcaseCourse; learners: (ShowcaseLearner & { userId: string })[];
    params: ItemParam[]; bugs: SimBug[]; exerciseB: number; gainRating: number; id: () => string;
  },
) {
  const enrollments: {
    id: string; userId: string; courseId: string; at: Date; orderId: string | null; progressPct: number;
    completedAt: Date | null; lastItemId: string | null; lastAccessedAt: Date | null;
  }[] = [];
  const progress: { enrollmentId: string; itemId: string; durationSec: number; completedAt: Date }[] = [];
  const attempts: SimAttempt[] = [];
  const submissions: SimSubmission[] = [];
  const skill: { userId: string; schedule: { at: Date; ability: number }[] }[] = [];
  const personas = new Map<string, Persona>();
  const items = a.course.items;
  const n = items.length;
  const quizIdx = items.findIndex((x) => x.id === a.course.quiz.itemId);
  const exIdx = items.findIndex((x) => x.id === a.course.exercise.itemId);
  const latest = addMs(a.now, -HOUR);
  const daysAgo = (d: number) => addMs(a.now, -d * DAY);

  for (const l of a.learners) {
    personas.set(l.userId, l.persona);
    const E = l.enrolledAt;
    const age = (a.now.getTime() - E.getTime()) / DAY;
    let target = 0;
    let end = E;
    switch (l.persona) {
      case 'finisher': target = n; end = minDate(latest, addMs(E, (10 + rng() * 50) * DAY)); break;
      case 'steady': target = int(rng, 2, n - 1); end = maxDate(addMs(E, DAY), daysAgo(0.1 + rng() * 5)); break;
      case 'stuck': target = quizIdx + 1; end = maxDate(addMs(E, DAY), daysAgo(0.5 + rng() * 8.5)); break;
      case 'stalled': target = int(rng, 1, quizIdx - 3); end = daysAgo(15 + rng() * (Math.min(90, age - 10) - 15)); break;
      case 'new': target = int(rng, 0, 2); end = addMs(E, rng() * (age - 0.05) * DAY); break;
      case 'ghost': break;
    }
    // Mốc hoàn thành từng item rải ngẫu nhiên trong (E, end], item cuối đúng end.
    const slots = Array.from({ length: target }, () => rng())
      .sort((x, y) => x - y)
      .map((u, i, arr) => (i === arr.length - 1 ? end : new Date(E.getTime() + u * (end.getTime() - E.getTime()))));
    const enrollmentId = a.id();
    let t = E;
    let lastActive: Date | null = null;
    let lastItemId: string | null = null;
    let done = 0;
    for (let i = 0; i < target; i++) {
      const item = items[i];
      lastItemId = item.id;
      let doneAt: Date | null = slots[i] ?? null;
      if (i === quizIdx) {
        const run: QuizRun = l.persona === 'finisher' ? { maxAttempts: 4, retake: 1, mustPass: true } : { maxAttempts: 3, retake: l.persona === 'stuck' ? 0.9 : 0.6 };
        // Lượt làm dồn trong ≤ 3 ngày trước mốc của item (học viên làm quiz ngay khi tới), không rải từ bài trước.
        const from = maxDate(t, addMs(slots[i], -3 * DAY));
        const r = simulateQuiz(rng, { quiz: a.course.quiz, param: (k) => a.params[k], userId: l.userId, theta: l.theta, from, to: slots[i], run, id: a.id });
        attempts.push(...r.attempts);
        lastActive = r.attempts.at(-1)!.submittedAt;
        doneAt = r.passedAt;
        // Persona kẹt mà đạt quiz (may mắn) thì kẹt ở bài code ngay sau đó.
        if (doneAt && l.persona === 'stuck') target = Math.min(n, exIdx + 1);
      } else if (i === exIdx) {
        const to = slots[i] ?? minDate(latest, addMs(t, DAY));
        const run: CodeRun =
          l.persona === 'finisher' ? { maxSubmissions: 6, mustPass: true }
          : l.persona === 'stuck' ? { maxSubmissions: int(rng, 3, 5), mustFail: true }
          : { maxSubmissions: 3, giveUp: 0.4 };
        const from = maxDate(t, addMs(to, -3 * DAY));
        const r = simulateExercise(rng, { exercise: a.course.exercise, bugs: a.bugs, b: a.exerciseB, userId: l.userId, theta: l.theta, from, to, run, id: a.id });
        submissions.push(...r.submissions);
        lastActive = r.submissions.at(-1)!.submittedAt;
        doneAt = r.acceptedAt;
      } else {
        lastActive = doneAt;
      }
      if (!doneAt) break;
      t = doneAt;
      progress.push({ enrollmentId, itemId: item.id, durationSec: item.durationSec, completedAt: t });
      done++;
    }
    enrollments.push({
      id: enrollmentId, userId: l.userId, courseId: a.course.id, at: E, orderId: null, progressPct: progressPct(done, n),
      completedAt: done === n ? t : null, lastItemId, lastAccessedAt: lastActive,
    });

    // Lịch đánh giá kỹ năng: ~60% đo trước khi ghi danh; học ≥ 50% thì ~70% đo lại sau, năng lực thật tăng theo tiến độ.
    const R0 = Math.min(1600, Math.max(950, 1250 + 130 * l.theta));
    const schedule: { at: Date; ability: number }[] = [];
    if (rng() < 0.6) schedule.push({ at: addMs(E, -(1 + rng() * 3) * DAY), ability: R0 });
    const frac = done / n;
    if (l.persona !== 'new' && frac >= 0.5 && lastActive && rng() < 0.7) {
      // Đo lại 1–3 lượt cách nhau vài ngày (như học viên làm lại bài đánh giá): Elo cần vài lượt mới bám sát năng lực mới.
      let at = minDate(addMs(lastActive, (1 + rng() * 5) * DAY), daysAgo(2));
      for (let k = 0; k < 3 && at.getTime() > E.getTime() + DAY && at <= daysAgo(2); k++) {
        schedule.push({ at, ability: R0 + a.gainRating * frac });
        at = addMs(at, (2 + rng() * 4) * DAY);
      }
    }
    if (schedule.length) skill.push({ userId: l.userId, schedule });
  }
  return { enrollments, progress, attempts, submissions, personas, skill };
}
