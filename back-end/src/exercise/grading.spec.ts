import { excerpt, judge, normalize, notificationBody, runTests, summarize, type RunResult } from './grading.js';

const ok = (stdout: string, timeMs: number | null = 5, memoryKb: number | null = 1000): RunResult => ({
  verdict: 'ok', stdout, stderr: '', compileOutput: null, timeMs, memoryKb,
});

describe('normalize / excerpt', () => {
  it('bỏ CRLF, khoảng trắng cuối dòng, dòng trống cuối', () => {
    expect(normalize('1 2  \r\n3\t\r\n\r\n')).toBe('1 2\n3');
  });
  it('giữ khoảng trắng đầu dòng và dòng trống ở giữa', () => {
    expect(normalize('  a\n\nb\n')).toBe('  a\n\nb');
  });
  it('excerpt cắt ở 2 KB', () => {
    expect(excerpt('x'.repeat(3000))).toHaveLength(2049);
    expect(excerpt('abc')).toBe('abc');
  });
  it('excerpt bỏ ký tự NUL (Postgres text không nhận 0x00)', () => {
    expect(excerpt('a\u0000b\u0000')).toBe('ab');
  });
});

describe('judge', () => {
  it('khớp sau chuẩn hoá → accepted, lệch → wrong_answer', () => {
    expect(judge(ok('3\r\n'), '3\n')).toBe('accepted');
    expect(judge(ok('4'), '3')).toBe('wrong_answer');
  });
  it('lỗi chạy giữ nguyên trạng thái, không so output', () => {
    expect(judge({ ...ok('3'), verdict: 'runtime_error' }, '3')).toBe('runtime_error');
    expect(judge({ ...ok(''), verdict: 'time_limit_exceeded' }, '3')).toBe('time_limit_exceeded');
  });
});

describe('runTests', () => {
  const tests = [
    { id: 'a', input: '1 2', expectedOutput: '3' },
    { id: 'b', input: '2 2', expectedOutput: '4' },
  ];
  it('chạy tuần tự từng test, truyền stdin', async () => {
    const run = vi.fn().mockResolvedValueOnce(ok('3')).mockResolvedValueOnce(ok('5'));
    const out = await runTests(run, 'javascript', 'code', tests);
    expect(run).toHaveBeenNthCalledWith(1, 'javascript', 'code', '1 2');
    expect(out.compileError).toBeNull();
    expect(out.results.map((r) => [r.testCaseId, r.status])).toEqual([['a', 'accepted'], ['b', 'wrong_answer']]);
  });
  it('lỗi biên dịch → dừng ngay, trả compileError', async () => {
    const run = vi.fn().mockResolvedValue({ ...ok(''), verdict: 'compile_error', compileOutput: 'main.cpp:1: error' });
    const out = await runTests(run, 'cpp', 'x', tests);
    expect(run).toHaveBeenCalledTimes(1);
    expect(out).toEqual({ compileError: 'main.cpp:1: error', results: [] });
  });
});

describe('summarize', () => {
  const tests = [
    { id: 'b', position: 1, points: 3 },
    { id: 'a', position: 0, points: 1 },
  ];
  it('đạt hết → accepted, 100 điểm, max time/memory bỏ null', () => {
    const s = summarize(tests, [
      { testCaseId: 'a', status: 'accepted', run: ok('', 7, 2000) },
      { testCaseId: 'b', status: 'accepted', run: ok('', null, null) },
    ]);
    expect(s).toEqual({ status: 'accepted', score: 100, passedTests: 2, maxTimeMs: 7, maxMemoryKb: 2000 });
  });
  it('trạng thái = test sai đầu tiên theo position, điểm theo trọng số', () => {
    const s = summarize(tests, [
      { testCaseId: 'b', status: 'runtime_error', run: ok('') },
      { testCaseId: 'a', status: 'wrong_answer', run: ok('') },
    ]);
    expect(s.status).toBe('wrong_answer');
    const t = summarize(tests, [
      { testCaseId: 'a', status: 'accepted', run: ok('') },
      { testCaseId: 'b', status: 'time_limit_exceeded', run: ok('') },
    ]);
    expect(t).toMatchObject({ status: 'time_limit_exceeded', score: 25, passedTests: 1 });
  });
  it('không có test → internal_error, 0 điểm', () => {
    expect(summarize([], [])).toEqual({ status: 'internal_error', score: 0, passedTests: 0, maxTimeMs: null, maxMemoryKb: null });
  });
});

describe('notificationBody', () => {
  it('có số test với verdict thường, không có với lỗi biên dịch / hệ thống', () => {
    expect(notificationBody('Two Sum', 'accepted', 5, 5)).toBe('Bài "Two Sum": Accepted 5/5 test');
    expect(notificationBody('Two Sum', 'wrong_answer', 3, 5)).toBe('Bài "Two Sum": Wrong Answer 3/5 test');
    expect(notificationBody('Two Sum', 'compile_error', 0, 5)).toBe('Bài "Two Sum": Lỗi biên dịch');
    expect(notificationBody('Two Sum', 'internal_error', 0, 0)).toBe('Bài "Two Sum": Lỗi hệ thống, hãy nộp lại');
  });
});
