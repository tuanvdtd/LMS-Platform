// Kiểu dữ liệu API dashboard phân tích giảng viên (BE: src/analytics). Ngày giờ là chuỗi ISO.
export type AnalyticsCourse = { id: string; title: string; status: string; enrolled: number };

export type FlagCode = 'negative_d' | 'low_d' | 'too_easy' | 'too_hard' | 'dead_distractor' | 'attractive_distractor';
export type ItemStatus = 'good' | 'review' | 'fix' | 'insufficient';
export type Verdict = 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'runtime_error' | 'compile_error';
export type Verdicts = Record<Verdict, number>;

export type QuizOverview = {
  quizId: string;
  itemId: string;
  title: string;
  sectionTitle: string;
  questionCount: number;
  learners: number;
  firstAttempt: { n: number; meanPct: number | null; medianPct: number | null; passRatePct: number | null };
  finalPassRatePct: number | null;
  avgAttemptsToPass: number | null;
  flagged: { fix: number; review: number };
};
export type ExerciseOverview = {
  exerciseId: string;
  itemId: string;
  title: string;
  learners: number;
  passRatePct: number | null;
  avgSubmissionsToPass: number | null;
  stuck: number;
  verdicts: Verdicts;
};
export type AssessmentsOverview = { minSample: number; quizzes: QuizOverview[]; exercises: ExerciseOverview[] };

export type QuestionAnalytics = {
  id: string;
  position: number;
  type: 'single_choice' | 'multiple_choice';
  stem: string;
  relatedItem: { id: string; title: string } | null;
  n: number;
  p: number | null;
  d: number | null;
  dSe: number | null; // sai số chuẩn của D
  pUpper: number | null;
  pLower: number | null;
  options: { id: string; content: string; isCorrect: boolean; pickedCount: number; pickedPct: number }[];
  status: ItemStatus;
  flags: { code: FlagCode; optionId?: string }[];
};
export type QuizAnalytics = {
  minSample: number;
  quiz: { id: string; itemId: string; courseId: string; title: string; passScorePct: number };
  summary: {
    n: number;
    meanPct: number | null;
    medianPct: number | null;
    passRateFirstPct: number | null;
    passRateFinalPct: number | null;
    avgAttemptsToPass: number | null;
  };
  histogram: { fromPct: number; toPct: number; count: number }[];
  questions: QuestionAnalytics[];
};
export type ExerciseAnalytics = {
  exercise: { id: string; itemId: string; courseId: string; title: string; difficulty: 'easy' | 'medium' | 'hard' };
  summary: { learners: number; passed: number; passRatePct: number | null; avgSubmissionsToPass: number | null; stuck: number; submissions: number };
  verdicts: Verdicts;
  tests: { id: string; position: number; isPublic: boolean; graded: number; failed: number; failRatePct: number | null }[];
};

export type GainBand = 'low' | 'medium' | 'high';
export type TopicSkill = {
  topicId: string;
  name: string;
  isPrimary: boolean;
  hasBank: boolean;
  measured: number;
  masteryPcts: number[] | null;
  gain: { pairs: number; prePct: number; postPct: number; g: number | null; band: GainBand | null; improved: number; same: number; declined: number } | null;
};
export type ClassSkills = { enrolled: number; minGroup: number; topics: TopicSkill[] };

export type RiskLevel = 'high' | 'watch' | 'ok' | 'new' | 'done';
export type RiskReason =
  | { code: 'inactive'; days: number }
  | { code: 'lagging'; lagPts: number; peerMedianPct: number; band: string }
  | { code: 'low_quiz'; avgFirstPct: number; gapPts: number };
export type NudgeKind = 'reminder' | 'encourage';
export type StudentRow = {
  userId: string;
  canMessage: boolean;
  name: string;
  image: string | null;
  enrolledAt: string;
  progressPct: number;
  lastActiveAt: string | null;
  completedAt: string | null;
  lastItem: { id: string; title: string } | null;
  quiz: { attempted: number; avgFirstPct: number | null };
  code: { passed: number; total: number };
  risk: { level: RiskLevel; inactiveDays: number; lagPts: number | null; peerMedianPct: number | null; band: string | null; quizGapPts: number | null; reasons: RiskReason[] };
  lastNudge: { at: string; kind: NudgeKind; returned: boolean } | null;
};
export type StudentFilter = 'all' | RiskLevel;
// Một trang học viên (20/trang) theo bộ lọc; counts đếm từng mức trên cả lớp.
export type StudentsAnalytics = {
  summary: { enrolled: number; active7d: number; completed: number; high: number; watch: number };
  counts: Record<StudentFilter, number>;
  page: number;
  pageSize: number;
  total: number;
  students: StudentRow[];
};
export type TimelineEvent =
  | { at: string; kind: 'enrolled' }
  | { at: string; kind: 'lecture_completed'; title: string }
  | { at: string; kind: 'quiz'; title: string; scorePct: number; passed: boolean; attemptNo: number }
  | { at: string; kind: 'submission'; title: string; status: Verdict; score: number }
  | { at: string; kind: 'nudge'; nudgeKind: NudgeKind };
export type StudentDetail = { student: StudentRow; timeline: TimelineEvent[] };
export type SkipReason = 'not_enrolled' | 'completed' | 'recent';
export type NudgeResult = { sent: string[]; skipped: { userId: string; reason: SkipReason }[] };

// --- Tổng quan, hành vi học, doanh thu: hợp đồng API (tỉ lệ là phân số 0..1) ---
// GET /instructor/analytics/lectures/:itemId/retention  (và Engagement.defaultLecture)
export type Retention = {
  itemId: string; title: string; label: string; // label "2.4" = phần.bài theo curriculum
  durationSec: number; bucketSec: number; n: number; enrolled: number; minViewers: number;
  points: { t: number; retention: number; stay: number; rewatch: number }[]; // t = giây đầu ô
  peaks: { fromSec: number; toSec: number; rewatch: number; people: number; multiple: number | null }[];
  drop: { fromSec: number; toSec: number; lost: number } | null;
  finished: number | null; avgWatched: number | null;
};
export type LectureEngagement = {
  itemId: string; title: string; label: string; durationSec: number;
  viewers: number; started: number | null; // viewers / enrolled
  finished: number | null; avgWatched: number | null; peaks: number;
  drop: { fromSec: number; toSec: number; lost: number } | null;
};
export type ProgressItemType = 'lecture' | 'quiz' | 'practice_test' | 'coding_exercise';
// GET /instructor/analytics/courses/:courseId/engagement
export type Engagement = {
  enrolled: number;
  kpis: { active7d: number; active7dPrev: number; watchMin30d: number; watchMin30dPrev: number; completed: number };
  weekly: { weekStart: string; active: number; newEnrollments: number; current: boolean }[]; // 12 tuần, cũ → mới
  progress: {
    n: number; minLearners: number; minAgeDays: number;
    items: { itemId: string; type: ProgressItemType; title: string; label: string; completed: number | null }[];
    bottleneck: { itemId: string; completed: number; drop: number } | null;
  };
  lectures: LectureEngagement[];
  defaultLecture: Retention | null;
};
export type FunnelStepKey = 'view' | 'cart' | 'checkout' | 'enroll';
// GET /instructor/analytics/courses/:courseId/funnel?days=7|30|90
export type Funnel = {
  courseId: string; isFree: boolean; days: number; minVisitors: number;
  steps: { key: FunnelStepKey; people: number }[];
  weakest: { key: FunnelStepKey; rate: number } | null; // bước có tỉ lệ giữ lại (so với bước trước) thấp nhất
  trackedSince: string | null; // ISO, lượt ghi sớm nhất của khoá
};
export type RevenueRange = '30d' | '12m';
export type RevenuePoint = { key: string; earned: number; gross: number; sales: number };
// GET /instructor/analytics/revenue?range=30d|12m
export type Sales = {
  verified: boolean; canSell: boolean; range: RevenueRange; // verified = có hồ sơ + ngân hàng; canSell = verified + có khoá giá > 0
  series: RevenuePoint[];
  totals: { earned: number; gross: number; sales: number };
  courses: {
    courseId: string; title: string; priceAmount: number;
    earned: number; sales: number; newEnrollments: number; visitors: number; conversion: number | null;
  }[];
};
// GET /instructor/analytics/overview
export type InstructorOverview = {
  name: string; verified: boolean; canSell: boolean;
  kpis: {
    earnedMonth: number; earnedPrevMonth: number;
    enrollments30d: number; enrollmentsPrev30d: number;
    active7d: number; active7dPrev: number;
    rating: number | null; reviewCount: number;
  };
  todo: {
    rejectedCourses: { count: number; firstTitle: string | null };
    unansweredQuestions: { count: number; oldestDays: number | null };
    highRisk: { count: number; topCourseId: string | null };
    lowReviews: number; unreadMessages: number;
  };
  revenue12m: RevenuePoint[];
  atRisk: {
    userId: string; name: string; image: string | null; courseId: string; courseTitle: string; canMessage: boolean;
    inactiveDays: number; progressPct: number; reasons: RiskReason[];
  }[];
  reviews: {
    distribution: { stars: 1 | 2 | 3 | 4 | 5; count: number }[]; // 5 → 1
    low: {
      courseId: string; courseTitle: string; userId: string; userName: string; userImage: string | null;
      rating: number; comment: string | null; createdAt: string; canMessage: boolean;
    }[];
  };
};
