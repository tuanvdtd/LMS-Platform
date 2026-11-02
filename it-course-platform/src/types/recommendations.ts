import type { CourseCard } from './catalog';
import type { Occupation } from './preferences';

export interface TopicRef {
  id: string;
  slug: string;
  name: string;
}
// Khớp back-end/src/recommendations/recommend-rules.ts.
export type Reason =
  | { type: 'goal'; topic: TopicRef }
  | { type: 'occupation'; occupation: Occupation; topics: TopicRef[] };
export type RecommendedCourse = CourseCard & { reason: Reason };
export interface RecommendationGroup {
  type: Reason['type'];
  courses: RecommendedCourse[];
}
