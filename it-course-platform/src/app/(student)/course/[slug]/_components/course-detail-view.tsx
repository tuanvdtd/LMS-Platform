'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, Users, Clock, Globe, Award, ChevronDown, ChevronUp,
  Play, HelpCircle, Code2, Paperclip, Check, AlertTriangle,
  ShieldCheck, Flag, BookOpen
} from 'lucide-react';
import { courses, demoStudent } from '@/lib/mocks/data';
import { RatingStars, PriceTag, SkillTagBadge, Btn } from '@/components/shared/product-ui';

const FAKE_REVIEWS = [
  { name: 'Văn Hùng', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=40&h=40&fit=crop', rating: 5, text: 'Khoá học cực kỳ chi tiết, giảng viên giải thích rõ ràng. Mình đã hiểu được custom hooks sau khi học xong chương 2.', date: '12/09/2025' },
  { name: 'Thu Hà', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop', rating: 4, text: 'Nội dung chất lượng, bài tập thực hành tốt. Chỉ mong thêm phần về React Query.', date: '05/09/2025' },
  { name: 'Quốc Bảo', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop', rating: 5, text: 'Từ khi học xong mình cảm thấy tự tin hơn rất nhiều khi code React. Đặc biệt phần performance optimization rất hay.', date: '28/08/2025' },
];

export default function CourseDetailView({ slug }: { slug: string }) {
  const course = courses.find((c) => c.slug === slug) ?? courses[0];
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set([course.curriculum[0]?.id]));
  const [reportOpen, setReportOpen] = useState(false);
  const [inCart, setInCart] = useState(false);
  const alreadyEnrolled = demoStudent.enrolledCourses.includes(course.id);

  function toggleChapter(id: string) {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalLessons = course.curriculum.reduce((s, c) => s + c.lessons.length, 0);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero dark */}
      <div style={{ background: '#1e293b' }} className="py-10 px-4">
        <div className="max-w-screen-xl mx-auto flex gap-8">
          <div className="flex-1 max-w-2xl">
            <p className="text-xs text-slate-400 mb-2">
              <Link href="/courses" className="hover:underline text-blue-400">Khoá học</Link>
              {' › '}
              <Link href={`/categories/${course.track}`} className="hover:underline text-blue-400 capitalize">{course.track}</Link>
              {' › '}
              <span className="text-slate-300 truncate">{course.title}</span>
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3 leading-tight">{course.title}</h1>
            <p className="text-slate-300 mb-4 text-sm">{course.subtitle}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
              <div className="flex items-center gap-1">
                <span className="font-bold text-amber-400">{course.rating}</span>
                <RatingStars rating={course.rating} />
                <span className="text-slate-400">({course.ratingCount.toLocaleString()} đánh giá)</span>
              </div>
              <span className="text-slate-400"><Users size={13} className="inline" /> {course.studentCount.toLocaleString()} học viên</span>
              {course.hasCertificate && (
                <span className="flex items-center gap-1 text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                  <ShieldCheck size={11} /> Đã được SkillPath kiểm duyệt
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs flex items-center gap-3">
              <span className="flex items-center gap-1"><BookOpen size={13} /> {course.instructor.name}</span>
              <span className="flex items-center gap-1"><Clock size={13} /> Cập nhật {course.updatedAt}</span>
              <span className="flex items-center gap-1"><Globe size={13} /> {course.language}</span>
            </p>
          </div>
          {/* Sidebar (desktop inline) */}
          <div className="hidden lg:block shrink-0 w-80">
            <CourseSidebar course={course} alreadyEnrolled={alreadyEnrolled} inCart={inCart} onAddCart={() => setInCart(true)} />
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-8 flex gap-8">
        <div className="flex-1 min-w-0 space-y-8">
          {/* Outcomes */}
          <section className="border rounded-xl p-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>Bạn sẽ học được</h2>
            <div className="grid md:grid-cols-2 gap-2">
              {course.learningOutcomes.map((o, i) => (
                <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                  <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                  {o}
                </div>
              ))}
            </div>
          </section>

          {/* Skills */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--foreground)' }}>Kỹ năng đạt được</h2>
            <div className="flex flex-wrap gap-2">
              {course.skills.map((s) => {
                const mastery = demoStudent.skills.find((sk) => sk.skillId === s.id)?.mastery;
                return <SkillTagBadge key={s.id} name={s.name} mastery={mastery} />;
              })}
            </div>
          </section>

          {/* Prerequisites */}
          {course.prerequisites.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--foreground)' }}>Yêu cầu tiên quyết</h2>
              <div className="space-y-2">
                {course.prerequisites.map((p) => {
                  const mastery = demoStudent.skills.find((sk) => sk.skillId === p.id)?.mastery ?? 0;
                  const ok = mastery >= 70;
                  return (
                    <div key={p.id} className="flex items-center gap-3 text-sm">
                      {ok ? (
                        <Check size={14} className="text-green-500 shrink-0" />
                      ) : (
                        <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                      )}
                      <span style={{ color: 'var(--foreground)' }}>{p.name}</span>
                      <span className="text-xs font-mono font-bold" style={{ color: ok ? 'var(--skill-strong)' : 'var(--skill-mid)' }}>
                        {mastery}%
                      </span>
                      {!ok && (
                        <Link href="/courses" className="text-xs text-blue-600 hover:underline">
                          Xem khoá bổ trợ →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Curriculum */}
          <section>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Nội dung khoá học
              <span className="ml-2 text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>
                {course.curriculum.length} chương · {totalLessons} bài học · {course.duration}h tổng
              </span>
            </h2>
            <div className="space-y-2">
              {course.curriculum.map((ch) => {
                const open = expandedChapters.has(ch.id);
                const chDuration = ch.lessons.reduce((s, l) => s + (l.duration ?? 0), 0);
                return (
                  <div key={ch.id} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => toggleChapter(ch.id)}
                      style={{ background: 'var(--secondary)' }}
                    >
                      <div className="flex items-center gap-2">
                        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{ch.title}</span>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {ch.lessons.length} bài · {Math.round(chDuration / 60)} phút
                      </span>
                    </button>
                    {open && (
                      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                        {ch.lessons.map((l) => {
                          const LIcon = l.type === 'video' ? Play : l.type === 'quiz' ? HelpCircle : l.type === 'coding' ? Code2 : Paperclip;
                          return (
                            <div key={l.id} className="flex items-center gap-3 px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>
                              <LIcon size={14} style={{ color: 'var(--muted-foreground)' }} className="shrink-0" />
                              <span className="flex-1 truncate">{l.title}</span>
                              {l.preview && (
                                <span className="text-xs text-blue-600 border border-blue-300 px-1.5 py-0.5 rounded">Xem trước</span>
                              )}
                              {l.duration && (
                                <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                                  {Math.round(l.duration / 60)} phút
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Instructor */}
          <section className="border rounded-xl p-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>Giảng viên</h2>
            <div className="flex gap-4">
              <Image src={course.instructor.avatar} alt={course.instructor.name} width={64} height={64} className="w-16 h-16 rounded-full object-cover shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/instructors/${course.instructor.id}`} className="font-bold text-blue-600 hover:underline">
                    {course.instructor.name}
                  </Link>
                  {course.instructor.verified && (
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      <ShieldCheck size={10} /> Đã xác minh
                    </span>
                  )}
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>{course.instructor.title}</p>
                <div className="flex gap-4 text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  <span className="flex items-center gap-1"><Star size={12} className="text-amber-400" /> {course.instructor.rating} đánh giá</span>
                  <span><Users size={12} className="inline" /> {course.instructor.studentCount.toLocaleString()} học viên</span>
                  <span><BookOpen size={12} className="inline" /> {course.instructor.courseCount} khoá</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>{course.instructor.bio}</p>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Đánh giá học viên
            </h2>
            <div className="flex items-center gap-6 mb-6">
              <div className="text-center">
                <p className="text-5xl font-extrabold text-amber-400">{course.rating}</p>
                <RatingStars rating={course.rating} size="md" />
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Đánh giá khoá học</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct = star === 5 ? 68 : star === 4 ? 22 : star === 3 ? 7 : star === 2 ? 2 : 1;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right" style={{ color: 'var(--muted-foreground)' }}>{star}★</span>
                      <span className="w-8" style={{ color: 'var(--muted-foreground)' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-4">
              {FAKE_REVIEWS.map((r) => (
                <div key={r.name} className="border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <Image src={r.avatar} alt={r.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{r.name}</p>
                      <div className="flex items-center gap-2">
                        <RatingStars rating={r.rating} size="sm" />
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{r.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{r.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Report */}
          <div>
            <button
              onClick={() => setReportOpen(true)}
              className="text-xs flex items-center gap-1 hover:underline"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Flag size={11} /> Báo cáo vi phạm
            </button>
          </div>
        </div>

        {/* Sticky sidebar desktop */}
        <div className="hidden lg:block shrink-0 w-80">
          <div className="sticky top-20">
            <CourseSidebar course={course} alreadyEnrolled={alreadyEnrolled} inCart={inCart} onAddCart={() => setInCart(true)} />
          </div>
        </div>
      </div>

      {/* Report dialog */}
      {reportOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-md space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>Báo cáo vi phạm</h3>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}>
              <option>Nội dung sai / không chính xác</option>
              <option>Vi phạm bản quyền</option>
              <option>Nội dung không phù hợp</option>
              <option>Khác</option>
            </select>
            <textarea
              placeholder="Mô tả vấn đề..."
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
            <div className="flex gap-2 justify-end">
              <Btn variant="secondary" onClick={() => setReportOpen(false)}>Huỷ</Btn>
              <Btn variant="danger" onClick={() => setReportOpen(false)}>Gửi báo cáo</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseSidebar({
  course,
  alreadyEnrolled,
  inCart,
  onAddCart,
}: {
  course: typeof courses[0];
  alreadyEnrolled: boolean;
  inCart: boolean;
  onAddCart: () => void;
}) {
  return (
    <div className="rounded-2xl border overflow-hidden shadow-xl" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="aspect-video bg-slate-900 relative group cursor-pointer">
        <Image src={course.thumbnail} alt="" fill sizes="320px" className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play size={20} className="text-blue-600 ml-1" />
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <PriceTag price={course.price} originalPrice={course.originalPrice} size="lg" />
        {alreadyEnrolled ? (
          <Link
            href={`/learn/${course.slug}/l-1`}
            className="block w-full text-center py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Vào học ngay
          </Link>
        ) : (
          <div className="space-y-2">
            <button
              onClick={onAddCart}
              className="block w-full text-center py-3 rounded-xl font-bold border transition-colors"
              style={{
                background: inCart ? 'var(--primary-light)' : 'var(--accent)',
                color: inCart ? 'var(--primary)' : '#fff',
                borderColor: inCart ? 'var(--primary)' : 'transparent',
              }}
            >
              {inCart ? '✓ Đã thêm vào giỏ' : 'Thêm vào giỏ'}
            </button>
            <Link
              href="/cart"
              className="block w-full text-center py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Mua ngay
            </Link>
          </div>
        )}
        <div className="space-y-2 pt-2 text-sm" style={{ color: 'var(--foreground)' }}>
          <p className="font-semibold">Khoá học bao gồm:</p>
          {[
            { icon: Play, text: `${course.duration} giờ video` },
            { icon: HelpCircle, text: `${course.quizCount} bài trắc nghiệm` },
            { icon: Code2, text: `${course.codeCount} bài tập lập trình` },
            { icon: Award, text: 'Chứng chỉ hoàn thành' },
            { icon: Clock, text: 'Truy cập trọn đời' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <Icon size={13} /> {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
