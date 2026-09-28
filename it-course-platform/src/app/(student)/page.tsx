import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Zap, Target, ArrowRight } from 'lucide-react';
import { courses, recommendations, demoStudent } from '@/lib/mocks/data';
import { CourseCard, RecommendationCard, SkillMasteryBar } from '@/components/shared/product-ui';
import FeaturedCourses from './_components/featured-courses';

export const metadata: Metadata = { title: 'Trang chủ | SkillPath' };

// Example router renders <HomePage isLoggedIn />; GuestHome kept for when auth lands.
const isLoggedIn = true;

export default function HomePage() {
  const weakSkills = demoStudent.skills
    .filter((s) => s.mastery < 50)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);

  if (!isLoggedIn) return <GuestHome />;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-12">
      {/* Continue learning */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            Tiếp tục học
          </h2>
          <Link href="/my-learning" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Xem tất cả <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {courses.slice(0, 2).map((c) => (
            <CourseCard key={c.id} course={c} progress={c.id === 'c-1' ? 34 : 100} />
          ))}
        </div>
      </section>

      {/* Weak skills */}
      <section>
        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'var(--primary-light)', borderColor: '#bfdbfe' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300">
              Kỹ năng bạn cần củng cố
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {weakSkills.map((skill) => (
              <div
                key={skill.skillId}
                className="rounded-xl p-4 bg-white dark:bg-slate-800"
                style={{ border: '1px solid var(--border)' }}
              >
                <SkillMasteryBar skill={skill} />
                <Link
                  href="/skills"
                  className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  Xem khoá ôn luyện <ArrowRight size={10} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommendations by reason */}
      {[
        { title: 'Lấp lỗ hổng kỹ năng', type: 'skill_gap', accent: true },
        { title: 'Bạn đã sẵn sàng học tiếp', type: 'prerequisite_met', accent: false },
        { title: 'Dành cho mục tiêu Frontend của bạn', type: 'goal', accent: false },
        { title: 'Học viên cùng track cũng mua', type: 'collaborative', accent: false },
      ].map(({ title, type, accent }) => {
        const recs = recommendations.filter((r) => r.reason.type === type);
        if (!recs.length) return null;
        return (
          <section key={type}>
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-xl font-bold ${accent ? 'text-orange-500' : ''}`}
                style={accent ? {} : { color: 'var(--foreground)' }}
              >
                {title}
              </h2>
              <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Xem thêm <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recs.map((c) => (
                <RecommendationCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        );
      })}

      <FeaturedCourses />
    </div>
  );
}

function GuestHome() {
  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-20 px-4"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1a1a2e 100%)' }}
      >
        <div className="max-w-3xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full mb-6 bg-blue-600/30 text-blue-300 border border-blue-500/30">
            <Zap size={14} />
            Học đúng thứ bạn còn thiếu
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Học lập trình<br />
            <span className="text-blue-400">theo năng lực thực tế</span>
          </h1>
          <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
            SkillPath đánh giá kỹ năng của bạn, rồi gợi ý lộ trình học cá nhân hoá — chỉ học thứ bạn thực sự cần.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors text-lg"
            >
              Bắt đầu miễn phí
            </Link>
            <Link
              href="/courses"
              className="px-8 py-3 rounded-xl font-bold border border-white/30 text-white hover:bg-white/10 transition-colors text-lg"
            >
              Khám phá khoá học
            </Link>
          </div>
        </div>
      </section>

      {/* 3 pillars */}
      <section className="max-w-screen-lg mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--foreground)' }}>
          SkillPath khác gì Udemy?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🎯',
              title: 'Đánh giá năng lực tự động',
              desc: 'Bài trắc nghiệm và bài lập trình được chấm tự động. Hệ thống tính chính xác bạn đang ở đâu.',
            },
            {
              icon: '🗺️',
              title: 'Lộ trình cá nhân hoá có lý do',
              desc: '"Gợi ý vì bạn đạt 35% ở React Hooks" — không chỉ gợi ý, mà giải thích tại sao.',
            },
            {
              icon: '📊',
              title: 'Phân tích học tập sâu',
              desc: 'Biết chính xác kỹ năng nào đang yếu, bài nào gây khó, nên học gì tiếp theo.',
            },
          ].map((p) => (
            <div
              key={p.title}
              className="rounded-2xl p-6 border"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="text-4xl mb-4">{p.icon}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                {p.title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section className="max-w-screen-xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
          Khoá học phổ biến
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {courses.slice(0, 4).map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>
    </div>
  );
}
