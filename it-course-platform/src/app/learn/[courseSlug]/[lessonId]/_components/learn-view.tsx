'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, CheckCircle, Circle, Play, HelpCircle,
  Code2, MessageCircle, BookOpen, X, Volume2,
  Settings, Maximize, RotateCcw, FastForward
} from 'lucide-react';
import { courses } from '@/lib/mocks/data';
import { ProgressRing } from '@/components/shared/product-ui';

export default function LearnView({ courseSlug, lessonId }: { courseSlug: string; lessonId: string }) {
  const course = courses.find((c) => c.slug === courseSlug) ?? courses[0];
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set(['l-1', 'l-2', 'l-22', 'l-23']));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'qa' | 'notes' | 'resources'>('overview');
  const [notes, setNotes] = useState('');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [skillBannerDismissed, setSkillBannerDismissed] = useState(false);

  const allLessons = course.curriculum.flatMap((ch) => ch.lessons);
  const currentLesson = allLessons.find((l) => l.id === lessonId) ?? allLessons[0];
  const currentIdx = allLessons.findIndex((l) => l.id === currentLesson.id);
  const nextLesson = allLessons[currentIdx + 1];
  const prevLesson = allLessons[currentIdx - 1];

  const progress = Math.round((completedLessons.size / allLessons.length) * 100);

  function toggleComplete(id: string) {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Top bar */}
      <div
        className="h-12 flex items-center px-4 gap-4 border-b shrink-0"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <Link href="/" className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--foreground)' }}>
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <BookOpen size={12} className="text-white" />
          </div>
          <span className="hidden sm:block text-blue-600">SkillPath</span>
        </Link>
        <div className="h-4 w-px" style={{ background: 'var(--border)' }} />
        <p className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--foreground)' }}>
          {course.title}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <ProgressRing progress={progress} size={32} />
          <span className="text-xs hidden sm:block" style={{ color: 'var(--muted-foreground)' }}>
            {completedLessons.size}/{allLessons.length} bài
          </span>
        </div>
        <button
          className="hidden sm:flex items-center gap-1 text-xs border px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          <MessageCircle size={12} /> Đánh giá
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Skill banner */}
          {!skillBannerDismissed && (
            <div className="px-4 py-2 flex items-center gap-3 text-sm border-b"
              style={{ background: 'var(--primary-light)', borderColor: '#bfdbfe', color: 'var(--primary)' }}>
              <span>📊 Bạn đạt 35% ở <strong>React Hooks</strong> — nên xem lại <Link href="#" className="underline">Bài 2.1</Link> trước</span>
              <button onClick={() => setSkillBannerDismissed(true)} className="ml-auto"><X size={14} /></button>
            </div>
          )}

          {/* Video player */}
          <div className="bg-black relative flex-1 min-h-0 flex items-center justify-center" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
            <div className="w-full h-full flex items-center justify-center" style={{ aspectRatio: '16/9', maxHeight: '100%', margin: 'auto' }}>
              {/* Mock video */}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
                    <Play size={32} className="text-white ml-2" />
                  </div>
                  <p className="text-white font-semibold text-lg">{currentLesson.title}</p>
                  <p className="text-slate-400 text-sm mt-1">{course.instructor.name}</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="h-1 bg-white/20 rounded-full mb-3 cursor-pointer">
                <div className="h-full w-1/3 bg-blue-500 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <button className="text-white hover:text-blue-400 transition-colors" aria-label="Tua lại 10s">
                  <RotateCcw size={18} />
                </button>
                <button className="text-white hover:text-blue-400 transition-colors" aria-label="Phát">
                  <Play size={22} />
                </button>
                <button className="text-white hover:text-blue-400 transition-colors" aria-label="Tua tới 10s">
                  <FastForward size={18} />
                </button>
                <button className="text-white hover:text-blue-400 transition-colors" aria-label="Âm lượng">
                  <Volume2 size={16} />
                </button>
                <div className="ml-auto flex items-center gap-3">
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(Number(e.target.value))}
                    className="bg-transparent text-white text-xs border border-white/30 rounded px-1 py-0.5"
                    aria-label="Tốc độ phát"
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                      <option key={r} value={r} className="text-black">{r}x</option>
                    ))}
                  </select>
                  <button className="text-white hover:text-blue-400 transition-colors" aria-label="Phụ đề">CC</button>
                  <button className="text-white hover:text-blue-400 transition-colors" aria-label="Cài đặt">
                    <Settings size={15} />
                  </button>
                  <button className="text-white hover:text-blue-400 transition-colors" aria-label="Toàn màn hình">
                    <Maximize size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <Link
              href={prevLesson ? `/learn/${courseSlug}/${prevLesson.id}` : '#'}
              className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border transition-colors ${!prevLesson ? 'opacity-30 pointer-events-none' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              <ChevronLeft size={16} /> Bài trước
            </Link>
            <button
              onClick={() => toggleComplete(currentLesson.id)}
              className="flex items-center gap-2 text-sm px-4 py-1.5 rounded-lg font-semibold transition-colors"
              style={{
                background: completedLessons.has(currentLesson.id) ? 'var(--skill-strong-bg)' : 'var(--primary)',
                color: completedLessons.has(currentLesson.id) ? 'var(--skill-strong)' : '#fff',
              }}
            >
              <CheckCircle size={14} />
              {completedLessons.has(currentLesson.id) ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
            </button>
            <Link
              href={nextLesson ? `/learn/${courseSlug}/${nextLesson.id}` : '#'}
              className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border transition-colors ${!nextLesson ? 'opacity-30 pointer-events-none' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              Bài tiếp <ChevronRight size={16} />
            </Link>
          </div>

          {/* Tabs */}
          <div className="border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex px-4">
              {(['overview', 'qa', 'notes', 'resources'] as const).map((tab) => {
                const labels = { overview: 'Tổng quan', qa: 'Hỏi đáp', notes: 'Ghi chú', resources: 'Tài liệu' };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                    style={{
                      borderColor: activeTab === tab ? 'var(--primary)' : 'transparent',
                      color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                    }}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'overview' && (
              <div className="max-w-2xl space-y-3">
                <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{currentLesson.title}</h2>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Trong bài học này, bạn sẽ tìm hiểu về các khái niệm cốt lõi và áp dụng chúng vào thực tiễn.
                </p>
              </div>
            )}
            {activeTab === 'notes' && (
              <div className="max-w-2xl">
                <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Ghi chú của bạn (tự động lưu)</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Viết ghi chú tại đây..."
                  rows={8}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            )}
            {activeTab === 'qa' && (
              <div className="max-w-2xl">
                <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>Chưa có câu hỏi nào. Hãy là người đầu tiên!</p>
                <textarea
                  placeholder="Đặt câu hỏi về bài học..."
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div
          className={`border-l shrink-0 flex flex-col transition-all duration-200 overflow-hidden ${sidebarOpen ? 'w-80' : 'w-0'}`}
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Nội dung khoá học</h3>
            <button onClick={() => setSidebarOpen(false)} aria-label="Đóng sidebar">
              <X size={16} style={{ color: 'var(--muted-foreground)' }} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {course.curriculum.map((ch) => (
              <div key={ch.id}>
                <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                  {ch.title}
                </div>
                {ch.lessons.map((l) => {
                  const active = l.id === currentLesson.id;
                  const done = completedLessons.has(l.id);
                  const LIcon = l.type === 'video' ? Play : l.type === 'quiz' ? HelpCircle : Code2;
                  return (
                    <Link
                      key={l.id}
                      href={`/learn/${courseSlug}/${l.id}`}
                      className="flex items-center gap-3 px-4 py-3 text-xs border-b transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                      style={{
                        borderColor: 'var(--border)',
                        background: active ? 'var(--primary-light)' : 'transparent',
                        color: active ? 'var(--primary)' : 'var(--foreground)',
                      }}
                    >
                      {done ? (
                        <CheckCircle size={14} className="text-green-500 shrink-0" />
                      ) : (
                        <Circle size={14} className="shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                      )}
                      <LIcon size={12} className="shrink-0" style={{ color: active ? 'var(--primary)' : 'var(--muted-foreground)' }} />
                      <span className="flex-1 leading-snug">{l.title}</span>
                      {l.duration && (
                        <span style={{ color: 'var(--muted-foreground)' }} className="shrink-0">
                          {Math.round(l.duration / 60)}p
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 border-l border-t border-b rounded-l-lg"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            aria-label="Mở sidebar"
          >
            <BookOpen size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
