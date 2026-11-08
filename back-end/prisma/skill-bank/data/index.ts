import type { SkillSeedQuestion } from '../types.ts';
import { CSS } from './css.ts';
import { HTML } from './html.ts';
import { JAVASCRIPT } from './javascript.ts';
import { NEXTJS } from './nextjs.ts';
import { NODEJS } from './nodejs.ts';
import { REACT } from './react.ts';
import { SQL } from './sql.ts';
import { TYPESCRIPT } from './typescript.ts';

export const SKILL_BANK: Record<string, SkillSeedQuestion[]> = {
  html: HTML,
  css: CSS,
  javascript: JAVASCRIPT,
  typescript: TYPESCRIPT,
  react: REACT,
  nextjs: NEXTJS,
  nodejs: NODEJS,
  sql: SQL,
};
