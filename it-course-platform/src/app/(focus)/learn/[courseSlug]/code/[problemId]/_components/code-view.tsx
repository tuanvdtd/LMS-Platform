'use client';

import { useState } from 'react';
import { Play, Upload, RotateCcw, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { demoProblem } from '@/lib/mocks/data';
import { VerdictBadge, SkillTagBadge } from '@/components/shared/product-ui';
import type { Verdict } from '@/types';

type RunResult = {
  testId: string;
  label: string;
  verdict: Verdict;
  input?: string;
  expected?: string;
  output?: string;
  time?: number;
  stderr?: string;
};

const SAMPLE_SOLUTION = `import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;`;

export default function CodeView() {
  const problem = demoProblem;
  const [lang, setLang] = useState('typescript');
  const [code, setCode] = useState(problem.starterCode[lang]);
  const [activeTab, setActiveTab] = useState<'problem' | 'history'>('problem');
  const [resultTab, setResultTab] = useState<'testcase' | 'result'>('testcase');
  const [runResults, setRunResults] = useState<RunResult[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, setSubmitted] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  function simulateRun(isSubmit: boolean) {
    if (isSubmit) setSubmitting(true);
    setResultTab('result');
    setRunResults(null);

    const publicTests = problem.testCases.filter((t) => !t.hidden);
    const hiddenTests = isSubmit ? problem.testCases.filter((t) => t.hidden) : [];

    const delay = 300;
    const allTests = [...publicTests, ...hiddenTests];

    allTests.forEach((tc, i) => {
      setTimeout(() => {
        const isCorrect = code.includes('setDebouncedValue') || Math.random() > 0.3;
        const verdict: Verdict = isCorrect ? 'AC' : i === 2 ? 'TLE' : 'WA';

        setRunResults((prev) => [
          ...(prev ?? []),
          {
            testId: tc.id,
            label: tc.hidden ? `Test ẩn #${i - publicTests.length + 1}` : `Test ${i + 1}`,
            verdict: 'Pending' as Verdict,
          },
        ]);

        setTimeout(() => {
          setRunResults((prev) =>
            (prev ?? []).map((r) =>
              r.testId === tc.id
                ? {
                    ...r,
                    verdict,
                    input: tc.hidden ? undefined : tc.input,
                    expected: tc.hidden ? undefined : tc.expectedOutput,
                    output: tc.hidden ? undefined : isCorrect ? tc.expectedOutput : 'undefined',
                    time: Math.floor(Math.random() * 50 + 5),
                  }
                : r
            )
          );
          if (i === allTests.length - 1 && isSubmit) setSubmitting(false);
          if (i === allTests.length - 1 && isSubmit) setSubmitted(true);
        }, 400);
      }, delay + i * 600);
    });
  }

  const passedCount = runResults?.filter((r) => r.verdict === 'AC').length ?? 0;
  const totalCount = runResults?.length ?? 0;
  const allDone = runResults && !runResults.some((r) => r.verdict === 'Pending' || r.verdict === 'Running');
  const finalVerdict: Verdict | null = allDone
    ? runResults!.every((r) => r.verdict === 'AC')
      ? 'AC'
      : runResults!.some((r) => r.verdict === 'TLE')
        ? 'TLE'
        : runResults!.some((r) => r.verdict === 'CE')
          ? 'CE'
          : 'WA'
    : null;

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPos(Math.max(30, Math.min(70, pct)));
  }

  return (
    <div
      className="h-[calc(100vh-56px)] flex"
      onMouseMove={handleMouseMove}
      onMouseUp={() => { setDragging(false); }}
      style={{ userSelect: dragging ? 'none' : 'auto' }}
    >
      {/* Left panel */}
      <div className="flex flex-col overflow-hidden" style={{ width: `${splitPos}%` }}>
        {/* Tabs */}
        <div className="flex border-b shrink-0" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {(['problem', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderColor: activeTab === t ? 'var(--primary)' : 'transparent',
                color: activeTab === t ? 'var(--primary)' : 'var(--muted-foreground)',
              }}
            >
              {t === 'problem' ? 'Đề bài' : 'Lịch sử nộp'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 text-sm" style={{ background: 'var(--background)' }}>
          {activeTab === 'problem' ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-extrabold mb-1" style={{ color: 'var(--foreground)' }}>
                  {problem.title}
                </h1>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Trung bình</span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Accepted: {problem.acceptanceRate}%
                  </span>
                  {problem.skills.map((s) => <SkillTagBadge key={s.id} name={s.name} />)}
                </div>
              </div>

              <div
                className="prose prose-sm max-w-none text-sm leading-relaxed"
                style={{ color: 'var(--foreground)' }}
              >
                {problem.description.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold mt-4 mb-2">{line.slice(3)}</h2>;
                  if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-bold mt-3 mb-1">{line.slice(4)}</h3>;
                  if (line.startsWith('- ')) return <li key={i} className="ml-4">{line.slice(2)}</li>;
                  if (line.startsWith('```')) return null;
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i}>{line}</p>;
                })}
              </div>

              <div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}>Ví dụ</h3>
                {problem.examples.map((ex, i) => (
                  <div key={i} className="rounded-lg p-3 mb-2 font-mono text-xs" style={{ background: 'var(--secondary)' }}>
                    <p style={{ color: 'var(--muted-foreground)' }}>Input: <span style={{ color: 'var(--foreground)' }}>{ex.input}</span></p>
                    <p style={{ color: 'var(--muted-foreground)' }}>Output: <span style={{ color: 'var(--foreground)' }}>{ex.output}</span></p>
                    {ex.explanation && <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>Giải thích: {ex.explanation}</p>}
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}>Ràng buộc</h3>
                <ul className="space-y-1">
                  {problem.constraints.map((c, i) => (
                    <li key={i} className="font-mono text-xs flex items-start gap-1" style={{ color: 'var(--foreground)' }}>
                      <span className="text-blue-500 mt-0.5">•</span> {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-4 text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                <span>⏱ Giới hạn: {problem.timeLimit}ms</span>
                <span>💾 Bộ nhớ: {problem.memoryLimit}MB</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { verdict: 'WA', score: 40, tests: '2/5', lang: 'TypeScript', time: '12/09/2025 14:32' },
                { verdict: 'CE', score: 0, tests: '0/5', lang: 'TypeScript', time: '12/09/2025 14:28' },
              ].map((s, i) => (
                <div key={i} className="border rounded-lg p-3 text-xs flex items-center gap-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <VerdictBadge verdict={s.verdict as Verdict} />
                  <span style={{ color: 'var(--muted-foreground)' }}>{s.tests} test</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>{s.lang}</span>
                  <span className="ml-auto" style={{ color: 'var(--muted-foreground)' }}>{s.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div
        className="w-1 cursor-col-resize hover:bg-blue-500 transition-colors shrink-0"
        style={{ background: 'var(--border)' }}
        onMouseDown={() => { setDragging(true); }}
      />

      {/* Right panel */}
      <div className="flex flex-col overflow-hidden flex-1">
        {/* Editor toolbar */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 border-b shrink-0"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <select
            value={lang}
            onChange={(e) => { setLang(e.target.value); setCode(problem.starterCode[e.target.value] ?? ''); }}
            className="text-xs border rounded px-2 py-1"
            style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
          >
            {problem.languages.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setCode(problem.starterCode[lang])}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              aria-label="Reset code"
            >
              <RotateCcw size={11} /> Reset
            </button>
            <button
              onClick={() => setCode(SAMPLE_SOLUTION)}
              className="text-xs px-2 py-1 rounded border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              Xem đáp án
            </button>
          </div>
        </div>

        {/* Code editor (mock textarea) */}
        <div className="flex-1 overflow-hidden min-h-0">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm resize-none outline-none"
            style={{
              background: '#1e293b',
              color: '#e2e8f0',
              lineHeight: '1.6',
              tabSize: 2,
            }}
            spellCheck={false}
          />
        </div>

        {/* Result panel */}
        <div className="border-t shrink-0" style={{ borderColor: 'var(--border)', maxHeight: '40%' }}>
          <div className="flex items-center border-b" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            {(['testcase', 'result'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setResultTab(t)}
                className="px-4 py-2 text-xs font-medium border-b-2 transition-colors"
                style={{
                  borderColor: resultTab === t ? 'var(--primary)' : 'transparent',
                  color: resultTab === t ? 'var(--primary)' : 'var(--muted-foreground)',
                }}
              >
                {t === 'testcase' ? 'Test case' : 'Kết quả'}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 pr-3">
              <button
                onClick={() => simulateRun(false)}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg border font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                <Play size={12} /> Chạy thử
              </button>
              <button
                onClick={() => simulateRun(true)}
                disabled={submitting}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                Nộp bài
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-3" style={{ background: 'var(--background)', maxHeight: '200px' }}>
            {resultTab === 'testcase' ? (
              <div className="space-y-2">
                {problem.testCases.filter((t) => !t.hidden).map((tc, i) => (
                  <div key={tc.id} className="text-xs font-mono space-y-1">
                    <p className="font-semibold" style={{ color: 'var(--muted-foreground)' }}>Test {i + 1}</p>
                    <div className="rounded p-2" style={{ background: 'var(--secondary)' }}>
                      <p style={{ color: 'var(--muted-foreground)' }}>Input: <span style={{ color: 'var(--foreground)' }}>{tc.input}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            ) : runResults === null ? (
              <p className="text-xs text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                Nhấn &quot;Chạy thử&quot; hoặc &quot;Nộp bài&quot; để xem kết quả
              </p>
            ) : (
              <div className="space-y-2">
                {finalVerdict && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                    <VerdictBadge verdict={finalVerdict} />
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {passedCount}/{totalCount} test đạt
                    </span>
                  </div>
                )}
                {runResults.map((r) => {
                  const Icon = r.verdict === 'AC' ? CheckCircle : r.verdict === 'WA' ? XCircle : r.verdict === 'TLE' ? Clock : r.verdict === 'Pending' || r.verdict === 'Running' ? Loader2 : AlertCircle;
                  const color = r.verdict === 'AC' ? 'var(--skill-strong)' : r.verdict === 'Pending' || r.verdict === 'Running' ? 'var(--muted-foreground)' : 'var(--skill-weak)';
                  return (
                    <div key={r.testId} className="text-xs rounded-lg p-2.5 border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                      <div className="flex items-center gap-2">
                        <Icon size={13} style={{ color }} className={r.verdict === 'Pending' || r.verdict === 'Running' ? 'animate-spin' : ''} />
                        <span className="font-semibold" style={{ color }}>{r.label}</span>
                        {r.verdict === 'AC' && r.time && <span style={{ color: 'var(--muted-foreground)' }}>{r.time}ms</span>}
                      </div>
                      {r.verdict === 'WA' && r.expected && (
                        <div className="mt-2 font-mono space-y-1" style={{ color: 'var(--muted-foreground)' }}>
                          <p>Expected: <span style={{ color: 'var(--skill-strong)' }}>{r.expected}</span></p>
                          <p>Output: <span style={{ color: 'var(--skill-weak)' }}>{r.output}</span></p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
