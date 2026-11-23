import { api } from '@/lib/api/client';
import type {
  AnalyticsCourse, AssessmentsOverview, ClassSkills, ExerciseAnalytics, NudgeKind, NudgeResult, QuizAnalytics, StudentDetail, StudentFilter, StudentsAnalytics,
} from '@/types/analytics';

// API dashboard phân tích của giảng viên. Chỉ gọi từ client component.
const base = '/instructor/analytics';

export const listAnalyticsCourses = () => api.get<AnalyticsCourse[]>(`${base}/courses`).then((r) => r.data);
export const getAssessments = (courseId: string) => api.get<AssessmentsOverview>(`${base}/courses/${courseId}/assessments`).then((r) => r.data);
export const getQuizAnalytics = (quizId: string) => api.get<QuizAnalytics>(`${base}/quizzes/${quizId}`).then((r) => r.data);
export const getExerciseAnalytics = (exerciseId: string) => api.get<ExerciseAnalytics>(`${base}/exercises/${exerciseId}`).then((r) => r.data);
export const getClassSkills = (courseId: string) => api.get<ClassSkills>(`${base}/courses/${courseId}/skills`).then((r) => r.data);
export const getStudents = (courseId: string, params: { level: StudentFilter; page: number }) =>
  api.get<StudentsAnalytics>(`${base}/courses/${courseId}/students`, { params }).then((r) => r.data);

// key = "<courseId>/<userId>" để dùng chung với useKeyed (một tham số).
export function getStudentDetail(key: string) {
  const [courseId, userId] = key.split('/');
  return api.get<StudentDetail>(`${base}/courses/${courseId}/students/${userId}`).then((r) => r.data);
}

export const sendNudges = (courseId: string, body: { userIds: string[]; kind: NudgeKind; message: string }) =>
  api.post<NudgeResult>(`${base}/courses/${courseId}/nudges`, body).then((r) => r.data);
