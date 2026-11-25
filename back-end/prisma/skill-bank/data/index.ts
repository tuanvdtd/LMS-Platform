import type { SkillSeedQuestion } from '../types.ts';
import { CSS } from './css.ts';
import { DATA_STRUCTURES } from './data-structures.ts';
import { DOCKER } from './docker.ts';
import { GIT } from './git.ts';
import { HTML } from './html.ts';
import { JAVA } from './java.ts';
import { JAVASCRIPT } from './javascript.ts';
import { KUBERNETES } from './kubernetes.ts';
import { LINUX } from './linux.ts';
import { MACHINE_LEARNING } from './machine-learning.ts';
import { NEXTJS } from './nextjs.ts';
import { NODEJS } from './nodejs.ts';
import { POSTGRESQL } from './postgresql.ts';
import { PYTHON } from './python.ts';
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
  python: PYTHON,
  docker: DOCKER,
  git: GIT,
  postgresql: POSTGRESQL,
  java: JAVA,
  kubernetes: KUBERNETES,
  linux: LINUX,
  'data-structures': DATA_STRUCTURES,
  'machine-learning': MACHINE_LEARNING,
};
