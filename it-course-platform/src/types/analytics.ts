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
