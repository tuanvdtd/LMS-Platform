import { RunnerUnavailableError, type Language, type Limits } from '../src/exercise/code-runner.js';
import type { RunResult } from '../src/exercise/grading.js';

// Thay Piston trong e2e (spec coding-exercise §11). "Mã nguồn" là lệnh giả: SUM → in tổng các số trong stdin;
// PRINT <x> → in x; COMPILE_ERROR / TLE / CRASH; DOWN → Piston sập.
export class FakeCodeRunner {
  calls = 0;

  run(_language: Language, code: string, stdin: string, _limits: Limits): Promise<RunResult> {
    this.calls++;
    const base = { stdout: '', stderr: '', compileOutput: null, timeMs: 1, memoryKb: 1024 };
    const cmd = code.trim();
    if (cmd === 'DOWN') return Promise.reject(new RunnerUnavailableError('fake down'));
    if (cmd === 'COMPILE_ERROR') return Promise.resolve({ ...base, verdict: 'compile_error', compileOutput: 'main.cpp:1: error' });
    if (cmd === 'TLE') return Promise.resolve({ ...base, verdict: 'time_limit_exceeded', timeMs: null });
    if (cmd === 'CRASH') return Promise.resolve({ ...base, verdict: 'runtime_error', stderr: `boom: ${stdin}` });
    if (cmd.startsWith('PRINT ')) return Promise.resolve({ ...base, verdict: 'ok', stdout: `${cmd.slice(6)}\n` });
    if (cmd === 'SUM') {
      const sum = stdin.split(/\s+/).filter(Boolean).reduce((s, x) => s + Number(x), 0);
      return Promise.resolve({ ...base, verdict: 'ok', stdout: `${sum}\n` });
    }
    return Promise.resolve({ ...base, verdict: 'runtime_error', stderr: `fake không hiểu: ${cmd}` });
  }
}
