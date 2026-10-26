import { api } from '@/lib/api/client';
import type { ExerciseDetail, ExerciseMutation, UpdateCodePayload, UpdateExercisePayload, VerifyReport } from '@/types/exercise';

// API soạn bài code.
const base = (courseId: string, itemId: string) => `/instructor/courses/${courseId}/items/${itemId}/exercise`;
const data = <T>(req: Promise<{ data: T }>) => req.then((r) => r.data);

export const getExercise = (courseId: string, itemId: string) => data<ExerciseDetail>(api.get(base(courseId, itemId)));
export const updateExercise = (courseId: string, itemId: string, body: UpdateExercisePayload) =>
  data<ExerciseMutation>(api.patch(base(courseId, itemId), body));
export const updateExerciseCode = (courseId: string, itemId: string, body: UpdateCodePayload) =>
  data<ExerciseMutation>(api.put(`${base(courseId, itemId)}/code`, body));
export const verifyExercise = (courseId: string, itemId: string) =>
  data<VerifyReport>(api.post(`${base(courseId, itemId)}/verify`));
