import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalize } from '../../src/exercise/grading.ts';
import { SEED_DATA } from './data/index.ts';

const RUN = { javascript: ['node', 'main.js'], python: ['python3', 'main.py'] } as const;
const dir = mkdtempSync(join(tmpdir(), 'seed-ex-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const cases = SEED_DATA.courses.flatMap((c) =>
  (c.exercise?.code ?? []).flatMap((k) => c.exercise!.tests.map((t, i) => ({ name: `${c.title} · ${k.language} · test ${i + 1}`, k, t }))),
);

describe('lời giải bài code', () => {
  it.each(cases)('$name', ({ k, t }) => {
    const [bin, file] = RUN[k.language];
    writeFileSync(join(dir, file), k.solution);
    const r = spawnSync(bin, [file], { cwd: dir, input: t.input, encoding: 'utf8', timeout: 10_000 });
    expect(r.status).toBe(0);
    expect(normalize(r.stdout)).toBe(normalize(t.expectedOutput));
  });
});
