import { LANGUAGES, RunnerUnavailableError, toRunResult } from './code-runner.js';

const stage = (over: object = {}) => ({
  stdout: '', stderr: '', output: '', code: 0, signal: null, status: null, message: null,
  cpu_time: 12.4, wall_time: 30, memory: 2_048_000, ...over,
});

describe('toRunResult', () => {
  it('chạy được → ok, timeMs từ cpu_time, memoryKb = memory/1024', () => {
    expect(toRunResult({ run: stage({ stdout: '3\n' }) })).toEqual({
      verdict: 'ok', stdout: '3\n', stderr: '', compileOutput: null, timeMs: 12, memoryKb: 2000,
    });
  });
  it('compile.code ≠ 0 → compile_error, lấy stderr của compile', () => {
    const r = toRunResult({ compile: stage({ code: 1, stderr: 'main.cpp:1: error' }) });
    expect(r).toMatchObject({ verdict: 'compile_error', compileOutput: 'main.cpp:1: error' });
  });
  it('compile_error: cắt dòng nhiễu chmod của Piston, giữ phần còn lại', () => {
    const stderr = "main.cpp:1:1: error: 'x' does not name a type\nchmod: cannot access 'a.out': No such file or directory\n";
    const r = toRunResult({ compile: stage({ code: 1, stderr }) });
    expect(r.compileOutput).toBe("main.cpp:1:1: error: 'x' does not name a type");
  });
  it('compile fail kèm run (Piston chép compile sang run) → vẫn compile_error', () => {
    const failed = stage({ code: 1, stderr: 'main.cpp:2: error' });
    expect(toRunResult({ compile: failed, run: failed })).toMatchObject({
      verdict: 'compile_error', compileOutput: 'main.cpp:2: error',
    });
  });
  it('compile bị kill (code null) vẫn là compile_error', () => {
    const r = toRunResult({ compile: stage({ code: null, signal: 'SIGKILL', stderr: 'out of time' }) });
    expect(r.verdict).toBe('compile_error');
  });
  it('status TO → time_limit_exceeded', () => {
    expect(toRunResult({ run: stage({ status: 'TO', signal: 'SIGKILL', code: null }) }).verdict).toBe('time_limit_exceeded');
  });
  it('OL / EL → runtime_error, stderr chỉ còn ghi chú; time/memory null vẫn giữ null', () => {
    const noisy = 'Sandbox keeper received fatal signal 6\nUGH: Lost track of the process';
    for (const status of ['OL', 'EL']) {
      const r = toRunResult({
        run: stage({ status, signal: 'SIGKILL', code: null, stderr: noisy, cpu_time: null, memory: null }),
      });
      expect(r).toMatchObject({
        verdict: 'runtime_error', stderr: '[Output vượt giới hạn]', timeMs: null, memoryKb: null,
      });
    }
  });
  it('exit ≠ 0 → runtime_error giữ nguyên stderr', () => {
    expect(toRunResult({ run: stage({ code: 1, stderr: 'TypeError' }) })).toMatchObject({ verdict: 'runtime_error', stderr: 'TypeError' });
  });
  it('bị kill: code 137 (Piston thật, status RE) hoặc SIGKILL → ghi chú bộ nhớ', () => {
    const oom = toRunResult({ run: stage({ code: 137, signal: null, status: 'RE', stderr: 'partial' }) });
    expect(oom.verdict).toBe('runtime_error');
    expect(oom.stderr).toBe('partial\n[Bị dừng — có thể vượt giới hạn bộ nhớ]');
    const killed = toRunResult({ run: stage({ code: null, signal: 'SIGKILL' }) });
    expect(killed.verdict).toBe('runtime_error');
    expect(killed.stderr).toBe('[Bị dừng — có thể vượt giới hạn bộ nhớ]');
  });
  it('status XX (lỗi nội bộ Piston) → RunnerUnavailableError', () => {
    expect(() => toRunResult({ run: stage({ status: 'XX', code: null }) })).toThrow(RunnerUnavailableError);
  });

  it('compile đạt mà không có run → RunnerUnavailableError', () => {
    expect(() => toRunResult({ compile: stage() })).toThrow(RunnerUnavailableError);
  });
});

describe('LANGUAGES', () => {
  it('C++ không đuôi file: Piston tự thêm .cpp, thông báo lỗi là main.cpp:L:C', () => {
    expect(LANGUAGES.cpp.file).toBe('main');
  });
});
