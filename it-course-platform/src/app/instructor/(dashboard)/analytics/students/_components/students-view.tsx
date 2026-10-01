'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { StatCard, Btn } from '@/components/shared/product-ui';

const ALL_STUDENTS = [
  { id: 's-1', name: 'Hoàng Văn Nam', progress: 12, score: 45, lastActive: '14 ngày trước', risk: 'high' },
  { id: 's-2', name: 'Nguyễn Thị Mai', progress: 35, score: 52, lastActive: '8 ngày trước', risk: 'high' },
  { id: 's-3', name: 'Phạm Quốc Hùng', progress: 58, score: 61, lastActive: '5 ngày trước', risk: 'medium' },
  { id: 's-4', name: 'Lê Thu Hằng', progress: 22, score: 38, lastActive: '10 ngày trước', risk: 'high' },
  { id: 's-5', name: 'Trần Đức Thắng', progress: 45, score: 67, lastActive: '6 ngày trước', risk: 'medium' },
  { id: 's-6', name: 'Bùi Minh Châu', progress: 89, score: 88, lastActive: '1 ngày trước', risk: 'low' },
  { id: 's-7', name: 'Đặng Thị Linh', progress: 76, score: 82, lastActive: '2 ngày trước', risk: 'low' },
  { id: 's-8', name: 'Vũ Đình Toàn', progress: 94, score: 91, lastActive: 'Hôm nay', risk: 'low' },
];

export function StudentsView() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [emailOpen, setEmailOpen] = useState(false);

  const filtered = ALL_STUDENTS.filter((s) => filter === 'all' || s.risk === filter);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>
          Phân tích Học viên
        </h1>
        {selected.size > 0 && (
          <Btn variant="primary" onClick={() => setEmailOpen(true)}>
            <Mail size={14} /> Gửi email ({selected.size} học viên)
          </Btn>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tổng học viên" value="284" change={12.5} />
        <StatCard label="Hoạt động (30d)" value="198" change={5.3} />
        <StatCard label="Nguy cơ bỏ học" value="5" sub="Cần chú ý" />
        <StatCard label="Điểm TB toàn lớp" value="67.4%" change={2.1} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([['all', 'Tất cả'], ['high', 'Nguy cơ cao'], ['medium', 'Theo dõi'], ['low', 'Tốt']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className="text-sm px-4 py-1.5 rounded-full border transition-colors"
            style={{
              background: filter === val ? 'var(--primary)' : 'var(--card)',
              color: filter === val ? '#fff' : 'var(--foreground)',
              borderColor: filter === val ? 'var(--primary)' : 'var(--border)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((s) => s.id)) : new Set())}
                  checked={selected.size === filtered.length && filtered.length > 0}
                />
              </th>
              {['Học viên', 'Tiến độ', 'Điểm TB', 'Hoạt động cuối', 'Rủi ro', ''].map((h) => (
                <th key={h} className="text-left px-3 py-3 font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs shrink-0" style={{ color: 'var(--foreground)' }}>
                      {s.name.split(' ').pop()?.charAt(0)}
                    </div>
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${s.progress}%`, background: s.progress < 30 ? 'var(--skill-weak)' : s.progress < 70 ? 'var(--skill-mid)' : 'var(--skill-strong)' }}
                      />
                    </div>
                    <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>{s.progress}%</span>
                  </div>
                </td>
                <td className="px-3 py-3 font-mono font-bold" style={{ color: s.score < 50 ? 'var(--skill-weak)' : s.score < 70 ? 'var(--skill-mid)' : 'var(--skill-strong)' }}>
                  {s.score}%
                </td>
                <td className="px-3 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>{s.lastActive}</td>
                <td className="px-3 py-3">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: s.risk === 'high' ? '#fee2e2' : s.risk === 'medium' ? '#fef9c3' : '#dcfce7',
                      color: s.risk === 'high' ? '#dc2626' : s.risk === 'medium' ? '#854d0e' : '#166534',
                    }}
                  >
                    {s.risk === 'high' ? 'Nguy cơ cao' : s.risk === 'medium' ? 'Theo dõi' : 'Tốt'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => { setSelected(new Set([s.id])); setEmailOpen(true); }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Nhắn tin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Email dialog */}
      {emailOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-lg space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              Gửi email nhắc nhở ({selected.size} học viên)
            </h3>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Mẫu email</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option>Nhắc nhở học tập — thân thiện</option>
                <option>Động viên — học viên tiến chậm</option>
                <option>Cung cấp tài nguyên bổ sung</option>
              </select>
            </div>
            <textarea
              rows={6}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              defaultValue={`Xin chào [Tên học viên],\n\nMình nhận thấy bạn đã không vào học trong một thời gian. Đừng bỏ cuộc nhé! Khoá học vẫn đang chờ bạn.\n\nNếu có khó khăn gì, hãy để lại câu hỏi ở phần Q&A — mình luôn sẵn sàng hỗ trợ.\n\nChúc bạn học tập hiệu quả!`}
            />
            <div className="flex gap-2 justify-end">
              <Btn variant="secondary" onClick={() => setEmailOpen(false)}>Huỷ</Btn>
              <Btn variant="primary" onClick={() => setEmailOpen(false)}>
                <Mail size={14} /> Gửi email
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
