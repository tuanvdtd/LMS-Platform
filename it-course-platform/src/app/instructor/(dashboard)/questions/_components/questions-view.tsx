'use client';

import { useState } from 'react';
import { Plus, AlertTriangle, Edit3, Trash2, Upload, Eye } from 'lucide-react';
import { demoQuiz } from '@/lib/mocks/data';
import { Btn } from '@/components/shared/product-ui';

type View = 'list' | 'new' | 'quiz';

const QUALITY_MAP = {
  good: { label: 'Tốt', bg: '#dcfce7', color: '#166534' },
  review: { label: 'Xem lại', bg: '#fef9c3', color: '#854d0e' },
  bad: { label: 'Kém', bg: '#fee2e2', color: '#dc2626' },
};

function quality(disc?: number, diff?: number): keyof typeof QUALITY_MAP {
  if (disc === undefined || diff === undefined) return 'review';
  if (disc >= 0.4 && diff >= 0.3 && diff <= 0.8) return 'good';
  if (disc < 0.2 || diff < 0.2 || diff > 0.9) return 'bad';
  return 'review';
}

export function QuestionsView() {
  const [view, setView] = useState<View>('list');
  const [filterQuality, setFilterQuality] = useState<string>('all');
  const [editQ, setEditQ] = useState<typeof demoQuiz.questions[0] | null>(null);

  const questions = demoQuiz.questions;
  const filtered = filterQuality === 'all'
    ? questions
    : questions.filter((q) => quality(q.discriminationIndex, q.difficultyActual) === filterQuality);

  if (view === 'new' || editQ) {
    return <QuestionForm q={editQ} onBack={() => { setView('list'); setEditQ(null); }} />;
  }
  if (view === 'quiz') {
    return <QuizBuilder onBack={() => setView('list')} />;
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>Ngân hàng câu hỏi</h1>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm" onClick={() => {}}>
            <Upload size={14} /> Import CSV
          </Btn>
          <Btn variant="secondary" size="sm" onClick={() => setView('quiz')}>
            Tạo bài kiểm tra
          </Btn>
          <Btn variant="primary" size="sm" onClick={() => setView('new')}>
            <Plus size={14} /> Thêm câu hỏi
          </Btn>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Lọc chất lượng:</span>
        {(['all', 'good', 'review', 'bad'] as const).map((q) => (
          <button
            key={q}
            onClick={() => setFilterQuality(q)}
            className="text-xs px-3 py-1 rounded-full border transition-colors"
            style={{
              background: filterQuality === q ? 'var(--primary)' : 'var(--card)',
              color: filterQuality === q ? '#fff' : 'var(--foreground)',
              borderColor: filterQuality === q ? 'var(--primary)' : 'var(--border)',
            }}
          >
            {q === 'all' ? 'Tất cả' : QUALITY_MAP[q].label}
          </button>
        ))}
        <span className="text-xs ml-auto" style={{ color: 'var(--muted-foreground)' }}>
          {filtered.length} câu hỏi
        </span>
      </div>

      <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}>
              {['Câu hỏi', 'Loại', 'Kỹ năng', 'Độ khó thực', 'Độ phân biệt', 'Chất lượng', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((q) => {
              const q_quality = quality(q.discriminationIndex, q.difficultyActual);
              const qStyle = QUALITY_MAP[q_quality];
              return (
                <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-4 py-3 max-w-72">
                    <p className="text-sm truncate" style={{ color: 'var(--foreground)' }}>
                      {q.content.split('\n')[0].slice(0, 60)}…
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}>
                      {q.type === 'single' ? '1 đáp án' : 'Nhiều đáp án'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {q.skills[0]?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--foreground)' }}>
                    {q.difficultyActual !== undefined ? `${(q.difficultyActual * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--foreground)' }}>
                    {q.discriminationIndex !== undefined ? q.discriminationIndex.toFixed(2) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: qStyle.bg, color: qStyle.color }}>
                      {qStyle.label}
                    </span>
                    {q_quality === 'bad' && (
                      <AlertTriangle size={12} className="inline ml-1 text-amber-500" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditQ(q)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Chỉnh sửa"
                      >
                        <Edit3 size={13} style={{ color: 'var(--muted-foreground)' }} />
                      </button>
                      <button className="p-1.5 rounded hover:bg-red-50 transition-colors" aria-label="Xoá">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Question Form ────────────────────────────────────────────────────────────
function QuestionForm({ q, onBack }: { q: typeof demoQuiz.questions[0] | null; onBack: () => void }) {
  const [content, setContent] = useState(q?.content ?? '');
  const [type, setType] = useState<'single' | 'multiple'>(q?.type ?? 'single');
  const [options, setOptions] = useState(
    q?.options ?? [
      { id: 'a', text: '', isCorrect: false },
      { id: 'b', text: '', isCorrect: false },
      { id: 'c', text: '', isCorrect: false },
      { id: 'd', text: '', isCorrect: false },
    ]
  );
  const [explanation, setExplanation] = useState(q?.explanation ?? '');
  const [preview, setPreview] = useState(false);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-sm text-blue-600 hover:underline">← Quay lại</button>
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>
            {q ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
          </h1>
        </div>

        <div className="border rounded-2xl p-5 space-y-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>Loại câu hỏi</label>
            <div className="flex gap-2">
              {(['single', 'multiple'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="text-sm px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    background: type === t ? 'var(--primary)' : 'var(--card)',
                    color: type === t ? '#fff' : 'var(--foreground)',
                    borderColor: type === t ? 'var(--primary)' : 'var(--border)',
                  }}
                >
                  {t === 'single' ? '1 đáp án đúng' : 'Nhiều đáp án đúng'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>
              Nội dung câu hỏi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Nhập câu hỏi. Hỗ trợ Markdown và code block (```javascript...```)."
              className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--foreground)' }}>
              Đáp án <span className="text-xs font-normal ml-1" style={{ color: 'var(--muted-foreground)' }}>
                (đánh dấu đáp án đúng)
              </span>
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type={type === 'single' ? 'radio' : 'checkbox'}
                    name="correct"
                    checked={opt.isCorrect}
                    onChange={() => {
                      if (type === 'single') {
                        setOptions((prev) => prev.map((o, j) => ({ ...o, isCorrect: j === i })));
                      } else {
                        setOptions((prev) => prev.map((o, j) => j === i ? { ...o, isCorrect: !o.isCorrect } : o));
                      }
                    }}
                    className="accent-blue-600 shrink-0"
                    aria-label={`Đáp án ${String.fromCharCode(65 + i)} đúng`}
                  />
                  <span className="text-xs font-mono font-bold w-5 shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <input
                    value={opt.text}
                    onChange={(e) => setOptions((prev) => prev.map((o, j) => j === i ? { ...o, text: e.target.value } : o))}
                    placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      borderColor: opt.isCorrect ? 'var(--skill-strong)' : 'var(--border)',
                      background: opt.isCorrect ? 'var(--skill-strong-bg)' : 'var(--background)',
                      color: 'var(--foreground)',
                    }}
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                      className="p-1.5 rounded hover:bg-red-50 text-red-400"
                      aria-label="Xoá đáp án"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setOptions((prev) => [
                  ...prev,
                  { id: String.fromCharCode(97 + prev.length), text: '', isCorrect: false },
                ])}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
              >
                <Plus size={13} /> Thêm đáp án
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>
              Giải thích (hiển thị sau khi trả lời)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              placeholder="Giải thích tại sao đáp án đúng là đúng..."
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>
              Tag kỹ năng <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="Chọn hoặc tạo tag kỹ năng..."
              defaultValue={q?.skills[0]?.name ?? ''}
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="mt-4 border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
            <p className="text-xs font-semibold mb-3 text-blue-600">Xem trước như học viên</p>
            <div className="font-mono text-sm whitespace-pre-wrap mb-4" style={{ color: 'var(--foreground)' }}>{content}</div>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-3 p-2.5 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                  <span style={{ color: 'var(--foreground)' }}>{String.fromCharCode(65 + i)}. {opt.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Btn variant="secondary" onClick={() => setPreview((p) => !p)}>
            <Eye size={14} /> {preview ? 'Ẩn xem trước' : 'Xem trước'}
          </Btn>
          <Btn variant="primary" onClick={onBack}>Lưu câu hỏi</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz Builder ─────────────────────────────────────────────────────────────
function QuizBuilder({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-sm text-blue-600 hover:underline">← Quay lại</button>
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>Tạo bài kiểm tra</h1>
        </div>

        <div className="space-y-4 border rounded-2xl p-5 mb-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          {[
            { label: 'Tên bài kiểm tra', type: 'text', placeholder: 'Vd: Kiểm tra React Hooks' },
            { label: 'Thời gian làm bài (phút)', type: 'number', placeholder: '30' },
            { label: 'Điểm đạt (%)', type: 'number', placeholder: '70' },
            { label: 'Số lần làm tối đa', type: 'number', placeholder: '3' },
          ].map(({ label, type, placeholder }) => (
            <div key={label}>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
          ))}
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="accent-blue-600" defaultChecked />
              <span style={{ color: 'var(--foreground)' }}>Xáo trộn câu hỏi</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="accent-blue-600" defaultChecked />
              <span style={{ color: 'var(--foreground)' }}>Xáo trộn đáp án</span>
            </label>
          </div>
        </div>

        <h3 className="font-bold mb-3" style={{ color: 'var(--foreground)' }}>
          Chọn câu hỏi ({selected.size} đã chọn)
        </h3>
        <div className="space-y-2 mb-4">
          {demoQuiz.questions.map((q) => (
            <label key={q.id} className="flex items-start gap-3 border rounded-xl p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ borderColor: 'var(--border)' }}>
              <input
                type="checkbox"
                checked={selected.has(q.id)}
                onChange={() => setSelected((prev) => {
                  const next = new Set(prev);
                  if (next.has(q.id)) next.delete(q.id);
                  else next.add(q.id);
                  return next;
                })}
                className="accent-blue-600 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: 'var(--foreground)' }}>
                  {q.content.split('\n')[0].slice(0, 80)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {q.type === 'single' ? '1 đáp án' : 'Nhiều đáp án'} · {q.skills[0]?.name}
                </p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Btn variant="secondary" onClick={onBack}>Huỷ</Btn>
          <Btn variant="primary" disabled={selected.size === 0} onClick={onBack}>
            Tạo bài kiểm tra ({selected.size} câu)
          </Btn>
        </div>
      </div>
    </div>
  );
}
