import type { SeedCourse } from '../types.ts';
import { COURSES as web } from './web.ts';
import { COURSES as data } from './data.ts';
import { COURSES as mobile } from './mobile.ts';
import { COURSES as devops } from './devops-testing.ts';
import { COURSES as langs } from './languages-se-game.ts';
import { COURSES as ai } from './ai.ts';
import { COURSES as itDesign } from './it-design.ts';

export const COURSES: SeedCourse[] = [...web, ...data, ...mobile, ...devops, ...langs, ...ai, ...itDesign];
