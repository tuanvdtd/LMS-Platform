'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MessageCircle, Send, ChevronDown } from 'lucide-react';
import { courses } from '@/lib/mocks/data';

const MOCK_QA = [
  {
    id: 'q1',
    student: 'Văn Hùng',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=32&h=32&fit=crop',
    course: courses[0].title,
    lesson: 'Bài 2.2 — useEffect và Lifecycle',
    question: 'Tại sao khi tôi dùng useEffect với dependency array rỗng [], nó vẫn chạy 2 lần trong development mode?',
    askedAt: '2 giờ trước',
    answered: false,
  },
  {
    id: 'q2',
    student: 'Thu Hà',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop',
    course: courses[0].title,
    lesson: 'Bài 2.4 — Custom Hooks',
    question: 'Có nên đặt custom hook trong thư mục riêng không? Quy ước đặt tên như thế nào là chuẩn?',
    askedAt: '5 giờ trước',
    answered: true,
    answer: 'Đây là câu hỏi hay! Thông thường custom hooks được đặt trong thư mục hooks/ hoặc utils/hooks/. Quy ước đặt tên bắt đầu bằng "use" theo React convention.',
  },
  {
    id: 'q3',
    student: 'Quốc Bảo',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop',
    course: courses[1].title,
    lesson: 'Bài 4.1 — TypeORM Relations',
    question: 'Khi nào nên dùng @OneToMany và khi nào dùng @ManyToMany? Sự khác biệt về performance?',
    askedAt: '1 ngày trước',
    answered: false,
  },
];

export function QAView() {
  const [filter, setFilter] = useState<'all' | 'unanswered'>('unanswered');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['q1', 'q3']));

  const displayed = filter === 'all' ? MOCK_QA : MOCK_QA.filter((q) => !q.answered);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>Hỏi đáp</h1>
        <div className="flex gap-2">
          {(['all', 'unanswered'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-sm px-4 py-1.5 rounded-full border transition-colors"
              style={{
                background: filter === f ? 'var(--primary)' : 'var(--card)',
                color: filter === f ? '#fff' : 'var(--foreground)',
                borderColor: filter === f ? 'var(--primary)' : 'var(--border)',
              }}
            >
              {f === 'all' ? 'Tất cả' : `Chưa trả lời (${MOCK_QA.filter((q) => !q.answered).length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {displayed.map((item) => {
          const open = expanded.has(item.id);
          return (
            <div
              key={item.id}
              className="border rounded-2xl overflow-hidden"
              style={{ borderColor: item.answered ? 'var(--border)' : '#bfdbfe', background: 'var(--card)' }}
            >
              {/* Question header */}
              <button
                className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => toggleExpand(item.id)}
              >
                <Image src={item.avatar} alt={item.student} width={32} height={32} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{item.student}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                      {item.lesson}
                    </span>
                    <span className="ml-auto text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>{item.askedAt}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{item.question}</p>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {!item.answered && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">Chưa trả lời</span>
                  )}
                  {item.answered && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Đã trả lời</span>
                  )}
                  <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--muted-foreground)' }} />
                </div>
              </button>

              {/* Expanded: existing answer + reply box */}
              {open && (
                <div className="px-5 pb-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  {item.answer && (
                    <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'var(--secondary)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>Trả lời của bạn:</p>
                      <p style={{ color: 'var(--foreground)' }}>{item.answer}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={answers[item.id] ?? ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="Viết câu trả lời..."
                      rows={3}
                      className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                    />
                    <button
                      className="self-end p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      disabled={!answers[item.id]?.trim()}
                      aria-label="Gửi trả lời"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {displayed.length === 0 && (
          <div className="text-center py-16">
            <MessageCircle size={36} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
            <p style={{ color: 'var(--muted-foreground)' }}>Không có câu hỏi nào chưa được trả lời</p>
          </div>
        )}
      </div>
    </div>
  );
}
