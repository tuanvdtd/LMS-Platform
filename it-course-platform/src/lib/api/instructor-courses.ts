import { api } from '@/lib/api/client';
import type { CourseDetail, CourseListItem, Ref, UpdateCoursePayload } from '@/types/instructor-course';

// API giảng viên (spec 2026-09-30-course-create-basics §4). Chỉ gọi từ client component:
// cần cookie session (api có withCredentials, 401 → interceptor chuyển /login).
export const createCourse = (title: string) =>
  api.post<{ id: string }>('/instructor/courses', { title }).then((r) => r.data);

export const listMyCourses = () => api.get<CourseListItem[]>('/instructor/courses').then((r) => r.data);

export const getCourse = (id: string) => api.get<CourseDetail>(`/instructor/courses/${id}`).then((r) => r.data);

export const updateCourse = (id: string, body: UpdateCoursePayload) =>
  api.patch<CourseDetail>(`/instructor/courses/${id}`, body).then((r) => r.data);

export const becomeInstructor = () => api.post('/me/become-instructor').then(() => undefined);

export const searchTopics = (q: string, signal?: AbortSignal) =>
  api.get<Ref[]>('/topics', { params: { q }, signal }).then((r) => r.data);
