import type { SeedData } from './types.ts';
import { USERS } from './users.ts';
import { COURSES } from './courses/index.ts';

export const SEED_DATA: SeedData = { users: USERS, courses: COURSES };
