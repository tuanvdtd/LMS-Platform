'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Flag, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { demoQuiz } from '@/lib/mocks/data';
import { Btn } from '@/components/shared/product-ui';
import { buttonVariants } from '@/components/ui/button';

type Phase = 'start' | 'quiz' | 'result';

export default function QuizView({ courseSlug }: { courseSlug: string }) {
  const quiz = demoQuiz;
  const [phase, setPhase] = useState<Phase>('start');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit);
  const [reviewIdx, setReviewIdx] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (phase === 'quiz') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setPhase('result');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [phase]);

  const q = quiz.questions[current];

  function select(optId: string) {
    setAnswers((prev) => {
      const cur = prev[q.id] ?? [];
      if (q.type === 'single') return { ...prev, [q.id]: [optId] };
      return {
        ...prev,
        [q.id]: cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId],
      };
    });
  }

  function calcScore(): { correct: number; total: number; skillScores: { skillName: string; score: number; mastery: number }[] } {
    let correct = 0;
    for (const q of quiz.questions) {
      const a = answers[q.id] ?? [];
      const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      if (a.length === correctIds.length && a.every((x) => correctIds.includes(x))) correct++;
    }
    return {
      correct,
      total: quiz.questions.length,
      skillScores: quiz.skills.map((s) => ({
        skillName: s.name,
        score: Math.round((correct / quiz.questions.length) * 100),
        mastery: s.id === 'react-hooks' ? 42 : 60,
      })),
    };
  }

  function fmt(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  if (phase === 'start') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={28} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-extrabold mb-3" style={{ color: 'var(--foreground)' }}>{quiz.title}</h1>
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          {[
            { label: 'Số câu hỏi', value: quiz.questions.length },
            { label: 'Thời gian', value: fmt(quiz.timeLimit) },
            { label: 'Điểm đạt', value: `${quiz.passingScore}%` },
            { label: 'Số lần làm', value: `${quiz.maxAttempts} lần` },
          ].map(({ label, value }) => (
            <div key={label} className="border rounded-xl p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <p style={{ color: 'var(--muted-foreground)' }}>{label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>{value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {quiz.skills.map((s) => (
            <span key={s.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
              {s.name}
            </span>
          ))}
        </div>
        <Btn variant="primary" size="lg" onClick={() => setPhase('quiz')}>
          Bắt đầu làm bài
        </Btn>
      </div>
    );
  }

  if (phase === 'result') {
    const { correct, total, skillScores } = calcScore();
    const score = Math.round((correct / total) * 100);
    const passed = score >= quiz.passingScore;

    if (reviewIdx !== null) {
      const rq = quiz.questions[reviewIdx];
      const selected = answers[rq.id] ?? [];
      return (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button onClick={() => setReviewIdx(null)} className="flex items-center gap-1 text-sm text-blue-600 mb-6 hover:underline">
            <ChevronLeft size={14} /> Quay lại kết quả
          </button>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
            Câu {reviewIdx + 1} / {quiz.questions.length}
          </p>
          <div className="rounded-xl p-4 mb-4 font-mono text-sm whitespace-pre-wrap" style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}>
            {rq.content}
          </div>
          <div className="space-y-2 mb-6">
            {rq.options.map((opt) => {
              const isSelected = selected.includes(opt.id);
              const bg = opt.isCorrect ? 'bg-green-50 border-green-400' : isSelected ? 'bg-red-50 border-red-400' : 'border-slate-200';
              return (
                <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${bg}`}>
                  {opt.isCorrect ? (
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                  ) : isSelected ? (
                    <XCircle size={16} className="text-red-500 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                  )}
                  <span style={{ color: 'var(--foreground)' }}>{opt.text}</span>
                </div>
              );
            })}
          </div>
          {rq.explanation && (
            <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <p className="font-semibold mb-1">💡 Giải thích</p>
              {rq.explanation}
            </div>
          )}
          <div className="flex justify-between mt-6">
            <Btn variant="secondary" onClick={() => setReviewIdx((i) => Math.max(0, (i ?? 0) - 1))} disabled={reviewIdx === 0}>
              <ChevronLeft size={14} /> Câu trước
            </Btn>
            <Btn variant="secondary" onClick={() => setReviewIdx((i) => Math.min(total - 1, (i ?? 0) + 1))} disabled={reviewIdx === total - 1}>
              Câu tiếp <ChevronRight size={14} />
            </Btn>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className={`text-6xl font-extrabold mb-2 ${passed ? 'text-green-500' : 'text-red-500'}`}>
            {score}%
          </div>
          <div className={`text-lg font-bold mb-1 ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {passed ? '✓ Đạt yêu cầu' : '✗ Chưa đạt'}
          </div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Đúng {correct}/{total} câu · Điểm đạt: {quiz.passingScore}%
          </p>
        </div>

        <div className="border rounded-xl p-5 mb-6 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h3 className="font-bold" style={{ color: 'var(--foreground)' }}>Điểm theo kỹ năng</h3>
          {skillScores.map((s) => (
            <div key={s.skillName} className="flex items-center gap-3 text-sm">
              <span className="w-32 truncate font-medium" style={{ color: 'var(--foreground)' }}>{s.skillName}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${s.score}%`,
                    background: s.score < 40 ? 'var(--skill-weak)' : s.score < 70 ? 'var(--skill-mid)' : 'var(--skill-strong)',
                  }}
                />
              </div>
              <span className="font-mono font-bold w-10 text-right" style={{ color: 'var(--foreground)' }}>{s.score}%</span>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-3" style={{ color: 'var(--foreground)' }}>Xem lại từng câu</h3>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((q, i) => {
              const sel = answers[q.id] ?? [];
              const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
              const ok = sel.length === correctIds.length && sel.every((x) => correctIds.includes(x));
              return (
                <button
                  key={q.id}
                  onClick={() => setReviewIdx(i)}
                  className="w-9 h-9 rounded-lg font-bold text-sm border-2 transition-colors hover:scale-110"
                  style={{
                    borderColor: ok ? 'var(--skill-strong)' : 'var(--skill-weak)',
                    background: ok ? 'var(--skill-strong-bg)' : 'var(--skill-weak-bg)',
                    color: ok ? 'var(--skill-strong)' : 'var(--skill-weak)',
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Btn variant="secondary" onClick={() => { setPhase('start'); setAnswers({}); setTimeLeft(quiz.timeLimit); setCurrent(0); }}>
            Làm lại
          </Btn>
          <Link href={`/learn/${courseSlug}/l-1`} className={buttonVariants()}>
            <BookOpen size={14} /> Tiếp tục học
          </Link>
        </div>
      </div>
    );
  }

  // Quiz phase
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: timeLeft < 60 ? 'var(--skill-weak)' : 'var(--foreground)' }}>
          <Clock size={16} />
          {fmt(timeLeft)}
        </div>
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {current + 1} / {quiz.questions.length}
        </span>
        <button
          onClick={() => setFlagged((f) => { const n = new Set(f); if (n.has(current)) n.delete(current); else n.add(current); return n; })}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border"
          style={{
            borderColor: flagged.has(current) ? 'var(--accent)' : 'var(--border)',
            color: flagged.has(current) ? 'var(--accent)' : 'var(--muted-foreground)',
          }}
        >
          <Flag size={12} /> {flagged.has(current) ? 'Đã đánh dấu' : 'Đánh dấu'}
        </button>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full mb-6 overflow-hidden" style={{ background: 'var(--secondary)' }}>
        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="rounded-xl p-5 mb-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <p className="text-xs font-semibold mb-2 text-blue-600">
          {q.type === 'multiple' ? 'Chọn nhiều đáp án đúng' : 'Chọn 1 đáp án đúng'}
        </p>
        <div className="font-mono text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--foreground)' }}>
          {q.content}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2 mb-8">
        {q.options.map((opt) => {
          const sel = (answers[q.id] ?? []).includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => select(opt.id)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left text-sm transition-all hover:border-blue-400"
              style={{
                borderColor: sel ? 'var(--primary)' : 'var(--border)',
                background: sel ? 'var(--primary-light)' : 'var(--card)',
                color: 'var(--foreground)',
              }}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}
              >
                {sel && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              {opt.text}
            </button>
          );
        })}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <Btn variant="secondary" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
          <ChevronLeft size={14} /> Câu trước
        </Btn>
        <div className="flex gap-1">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-7 h-7 rounded text-xs font-semibold transition-colors"
              style={{
                background: i === current ? 'var(--primary)' : answers[quiz.questions[i].id] ? 'var(--skill-strong-bg)' : 'var(--secondary)',
                color: i === current ? '#fff' : answers[quiz.questions[i].id] ? 'var(--skill-strong)' : 'var(--muted-foreground)',
              }}
            >
              {flagged.has(i) ? '⚑' : i + 1}
            </button>
          ))}
        </div>
        {current < quiz.questions.length - 1 ? (
          <Btn variant="primary" onClick={() => setCurrent((c) => c + 1)}>
            Câu tiếp <ChevronRight size={14} />
          </Btn>
        ) : (
          <Btn variant="accent" onClick={() => { clearInterval(intervalRef.current); setPhase('result'); }}>
            Nộp bài
          </Btn>
        )}
      </div>
    </div>
  );
}
