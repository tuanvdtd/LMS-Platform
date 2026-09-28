'use client';

import { useState } from 'react';
import { Plus, Edit3, Play, Trash2 } from 'lucide-react';
import { demoProblem } from '@/lib/mocks/data';
import { Btn, VerdictBadge } from '@/components/shared/product-ui';
import type { Verdict } from '@/types';

type View = 'list' | 'new';

const MOCK_PROBLEMS = [
  { id: 'p-1', title: 'Xây dựng useDebounce Hook', skills: ['React Hooks'], acceptance: 73.2, languages: ['TypeScript', 'JavaScript'] },
  { id: 'p-2', title: 'SQL: Tìm học viên có điểm cao nhất mỗi khoá', skills: ['SQL Joins'], acceptance: 61.5, languages: ['SQL'] },
  { id: 'p-3', title: 'Cài đặt thuật toán tìm kiếm nhị phân', skills: ['Algorithms'], acceptance: 88.4, languages: ['JavaScript', 'Python', 'C++'] },
];

export function ProblemsView() {
  const [view, setView] = useState<View>('list');

  if (view === 'new') return <ProblemForm onBack={() => setView('list')} />;

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>Bài tập lập trình</h1>
        <Btn variant="primary" size="sm" onClick={() => setView('new')}>
          <Plus size={14} /> Thêm bài tập
        </Btn>
      </div>

      <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}>
              {['Tiêu đề', 'Kỹ năng', 'Ngôn ngữ', 'Tỉ lệ Accepted', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {MOCK_PROBLEMS.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>{p.title}</td>
                <td className="px-4 py-3">
                  {p.skills.map((s) => (
                    <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full mr-1">{s}</span>
                  ))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {p.languages.map((l) => (
                      <span key={l} className="text-xs border rounded px-1.5 py-0.5" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>{l}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p.acceptance}%`,
                          background: p.acceptance >= 70 ? 'var(--skill-strong)' : p.acceptance >= 50 ? 'var(--skill-mid)' : 'var(--skill-weak)',
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono" style={{ color: 'var(--foreground)' }}>{p.acceptance}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setView('new')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="Chỉnh sửa">
                      <Edit3 size={13} style={{ color: 'var(--muted-foreground)' }} />
                    </button>
                    <button className="p-1.5 rounded hover:bg-red-50 transition-colors" aria-label="Xoá">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Problem Form ─────────────────────────────────────────────────────────────
function ProblemForm({ onBack }: { onBack: () => void }) {
  const p = demoProblem;
  const [testRunResult, setTestRunResult] = useState<Verdict | null>(null);
  const [testCases, setTestCases] = useState(p.testCases);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-sm text-blue-600 hover:underline">← Quay lại</button>
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>Tạo bài tập lập trình</h1>
        </div>

        <div className="space-y-5">
          {/* Basic info */}
          <div className="border rounded-2xl p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Thông tin cơ bản</h2>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--foreground)' }}>Tiêu đề</label>
              <input
                defaultValue={p.title}
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--foreground)' }}>Giới hạn thời gian (ms)</label>
                <input
                  type="number"
                  defaultValue={p.timeLimit}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--foreground)' }}>Giới hạn bộ nhớ (MB)</label>
                <input
                  type="number"
                  defaultValue={p.memoryLimit}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--foreground)' }}>Ngôn ngữ cho phép</label>
              <div className="flex flex-wrap gap-2">
                {['javascript', 'typescript', 'python', 'java', 'cpp'].map((l) => (
                  <label key={l} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" defaultChecked={p.languages.includes(l)} className="accent-blue-600" />
                    <span style={{ color: 'var(--foreground)' }}>{l}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="flex border-b" style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}>
              <button className="px-4 py-2 text-sm font-medium border-b-2 border-blue-500 text-blue-600">Markdown</button>
              <button className="px-4 py-2 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Xem trước</button>
            </div>
            <textarea
              defaultValue={p.description}
              rows={10}
              className="w-full p-4 text-sm font-mono outline-none"
              style={{ background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          {/* Test cases */}
          <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Test cases</h2>
              <div className="flex gap-2">
                <Btn variant="secondary" size="sm">Import file</Btn>
                <Btn
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setTestRunResult(null);
                    setTimeout(() => setTestRunResult('AC'), 1200);
                  }}
                >
                  <Play size={12} /> Chạy thử với lời giải mẫu
                </Btn>
              </div>
            </div>

            {testRunResult && (
              <div className="mb-3 p-2.5 rounded-lg border flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                <VerdictBadge verdict={testRunResult} />
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {testRunResult === 'AC' ? 'Tất cả test cases đều đúng!' : 'Có test case sai — kiểm tra lại'}
                </span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    {['Input', 'Expected Output', 'Ẩn', 'Trọng số', ''].map((h) => (
                      <th key={h} className="text-left px-2 py-2 font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {testCases.map((tc) => (
                    <tr key={tc.id}>
                      <td className="px-2 py-2">
                        <input
                          defaultValue={tc.input}
                          className="border rounded px-2 py-1 w-28 font-mono text-xs outline-none"
                          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          defaultValue={tc.expectedOutput}
                          className="border rounded px-2 py-1 w-28 font-mono text-xs outline-none"
                          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          defaultChecked={tc.hidden}
                          className="accent-blue-600"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          defaultValue={tc.weight}
                          className="border rounded px-2 py-1 w-12 text-xs outline-none"
                          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => setTestCases((prev) => prev.filter((t) => t.id !== tc.id))}
                          className="p-1 rounded hover:bg-red-50 text-red-400"
                          aria-label="Xoá test case"
                        >
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setTestCases((prev) => [
                ...prev,
                { id: `tc-new-${Date.now()}`, input: '', expectedOutput: '', hidden: false, weight: 1 },
              ])}
              className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <Plus size={11} /> Thêm test case
            </button>
          </div>

          <div className="flex gap-3">
            <Btn variant="secondary" onClick={onBack}>Huỷ</Btn>
            <Btn variant="primary" onClick={onBack}>Lưu bài tập</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
