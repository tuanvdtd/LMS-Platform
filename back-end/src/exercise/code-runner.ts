import { Injectable } from '@nestjs/common';
import { optionalEnv } from '../env.js';
import type { RunResult } from './grading.js';

// File duy nhất biết Piston. Đổi engine (vd Cloudflare Sandbox) chỉ sửa file này.
// Thêm ngôn ngữ: cài package Piston (piston/install-runtimes.sh) + thêm 1 dòng (FE thêm mẫu starter).
export const LANGUAGE_IDS = ['javascript', 'python', 'cpp'] as const;
export type Language = (typeof LANGUAGE_IDS)[number];
// cpp.file không đuôi: script gcc của Piston tự nối ".cpp" (đặt "main.cpp" sẽ ra lỗi "main.cpp.cpp:L:C").
// cpuLimitMs: mốc CPU cố định mỗi test cho mọi bài. JS/Python cao hơn vì chậm hơn C++ nhiều lần và tốn ~100–250 ms CPU
// chỉ để khởi động runtime. Đổi mốc → sửa cả CPU_LIMIT_MS ở it-course-platform/src/types/exercise.ts.
export const LANGUAGES: Record<Language, { label: string; runtime: string; version: string; file: string; cpuLimitMs: number }> = {
  javascript: { label: 'JavaScript', runtime: 'javascript', version: '20.11.1', file: 'main.js', cpuLimitMs: 4000 },
  python: { label: 'Python', runtime: 'python', version: '3.12.0', file: 'main.py', cpuLimitMs: 6000 },
  cpp: { label: 'C++', runtime: 'c++', version: '10.2.0', file: 'main', cpuLimitMs: 2000 },
};
// Chung mọi ngôn ngữ; Node khởi động đã tốn ~50 MB. 2 job Piston song song × 256 MiB vẫn trong mem_limit 1g của container.
export const MEMORY_LIMIT_KB = 256 * 1024;

export class RunnerUnavailableError extends Error {}

type Stage = {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null;
  signal: string | null;
  status?: string | null; // TO quá giờ, OL/EL output quá dài, RE/SG/XX…
  message?: string | null;
  cpu_time?: number | null; // ms
  wall_time?: number | null; // ms
  memory?: number | null; // bytes
};
export type PistonResponse = { compile?: Stage; run?: Stage };

const COMPILE_TIMEOUT_MS = 10_000;
// TLE xét theo CPU time (khớp con số hiển thị, không phụ thuộc máy bận). Wall chỉ là lưới an toàn cho code sleep/treo
// không tốn CPU; gấp đôi để lời giải không bị kill oan khi Piston chạy song song hoặc giả lập amd64.
const WALL_FACTOR = 2;
const OUTPUT_LIMIT_NOTE = '[Output vượt giới hạn]';
const KILLED_NOTE = '[Bị dừng — có thể vượt giới hạn bộ nhớ]';

// Piston gcc hay chèn dòng này khi biên dịch hỏng — không phải lỗi của học viên.
const compileText = (s: string) =>
  s.split('\n').filter((l) => !l.includes("chmod: cannot access 'a.out'")).join('\n').trimEnd();

export function toRunResult({ compile, run }: PistonResponse): RunResult {
  // Phải xét compile trước run: Piston chép kết quả compile lỗi sang run. `!== 0` để compile bị kill (code null) cũng là lỗi.
  if (compile && compile.code !== 0) {
    const compileOutput = compileText(compile.stderr) || compileText(compile.output) || compile.message || '';
    return { verdict: 'compile_error', stdout: '', stderr: '', compileOutput, timeMs: null, memoryKb: null };
  }
  if (!run) throw new RunnerUnavailableError('Piston không trả kết quả run');
  const base = {
    stdout: run.stdout,
    stderr: run.stderr,
    compileOutput: null,
    timeMs: run.cpu_time != null ? Math.round(run.cpu_time) : null,
    memoryKb: run.memory != null ? Math.round(run.memory / 1024) : null,
  };
  if (run.status === 'XX') throw new RunnerUnavailableError('Piston lỗi nội bộ (status XX)');
  if (run.status === 'TO') return { ...base, verdict: 'time_limit_exceeded', timeMs: null };
  if (run.status === 'OL' || run.status === 'EL') {
    // stderr của Piston lúc này chỉ là nhiễu isolate ("Sandbox keeper received fatal signal 6…").
    return { ...base, verdict: 'runtime_error', stderr: OUTPUT_LIMIT_NOTE };
  }
  if (run.code !== 0 || run.signal) {
    // Hết bộ nhớ: Piston thật trả code 137, signal null, status RE (không phải SIGKILL).
    const killed = run.code === 137 || run.signal === 'SIGKILL' ? KILLED_NOTE : '';
    return { ...base, verdict: 'runtime_error', stderr: [run.stderr || run.message || '', killed].filter(Boolean).join('\n') };
  }
  return { ...base, verdict: 'ok' };
}

export function pistonRequest(language: Language, code: string, stdin: string) {
  const lang = LANGUAGES[language];
  return {
    language: lang.runtime,
    version: lang.version,
    files: [{ name: lang.file, content: code }],
    stdin,
    compile_timeout: COMPILE_TIMEOUT_MS,
    run_cpu_time: lang.cpuLimitMs,
    //  Python 6 s × 2 = 12 s wall mỗi test; bài nộp TLE ở nhiều test chạy tuần tự tiến gần TTL 300 s của withRunLock
    // và ngưỡng "kẹt" 5 phút. Nâng cấp: dừng sớm sau test TLE đầu tiên hoặc nới TTL.
    run_timeout: lang.cpuLimitMs * WALL_FACTOR,
    run_memory_limit: MEMORY_LIMIT_KB * 1024,
  };
}

@Injectable()
export class CodeRunner {
  private readonly url = optionalEnv('PISTON_URL') ?? 'http://127.0.0.1:2000';

  async run(language: Language, code: string, stdin: string): Promise<RunResult> {
    let res: Response;
    try {
      res = await fetch(`${this.url}/api/v2/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pistonRequest(language, code, stdin)),
        // ponytail: +30s biên cho thời gian xếp hàng chờ slot Piston; hàng đợi dài hơn thế sẽ bị coi là Piston không dùng được.
        signal: AbortSignal.timeout(COMPILE_TIMEOUT_MS + LANGUAGES[language].cpuLimitMs * WALL_FACTOR + 30_000),
      });
    } catch (err) {
      throw new RunnerUnavailableError(`Không gọi được Piston: ${String(err)}`);
    }
    // Đọc body cũng có thể đứt giữa chừng (timeout, ngắt kết nối) → coi như Piston không dùng được.
    if (!res.ok) {
      let body = '';
      try {
        body = (await res.text()).slice(0, 200);
      } catch (err) {
        body = String(err).slice(0, 200);
      }
      throw new RunnerUnavailableError(`Piston trả ${res.status}: ${body}`);
    }
    let json: PistonResponse;
    try {
      json = (await res.json()) as PistonResponse;
    } catch (err) {
      throw new RunnerUnavailableError(`Piston trả body không đọc được: ${String(err).slice(0, 200)}`);
    }
    return toRunResult(json);
  }
}
