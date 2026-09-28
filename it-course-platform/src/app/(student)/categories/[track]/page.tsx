import type { Metadata } from 'next';
import Link from 'next/link';
import { courses } from '@/lib/mocks/data';
import { CourseCard } from '@/components/shared/product-ui';

export const metadata: Metadata = { title: 'Danh mục khoá học | SkillPath' };

const TRACK_META: Record<string, { label: string; desc: string; color: string; icon: string }> = {
  frontend: { label: 'Frontend', desc: 'React, Vue, TypeScript, CSS — xây dựng giao diện web hiện đại', color: '#2563eb', icon: '⚡' },
  backend: { label: 'Backend', desc: 'Node.js, Java, Python — kiến trúc server và API', color: '#7c3aed', icon: '⚙️' },
  fullstack: { label: 'Fullstack', desc: 'Kết hợp frontend và backend để xây dựng sản phẩm hoàn chỉnh', color: '#0891b2', icon: '🔗' },
  database: { label: 'Database', desc: 'SQL, NoSQL, thiết kế schema và tối ưu truy vấn', color: '#b45309', icon: '🗄️' },
  devops: { label: 'DevOps', desc: 'Docker, Kubernetes, CI/CD — tự động hoá hạ tầng', color: '#15803d', icon: '🚀' },
  mobile: { label: 'Mobile', desc: 'React Native, Flutter — phát triển ứng dụng di động', color: '#be185d', icon: '📱' },
};

const SKILL_ROADMAP: Record<string, { name: string; mastery: number }[][]> = {
  frontend: [
    [{ name: 'HTML/CSS', mastery: 90 }, { name: 'Flexbox/Grid', mastery: 75 }],
    [{ name: 'JavaScript ES6+', mastery: 70 }, { name: 'DOM API', mastery: 65 }],
    [{ name: 'React Basics', mastery: 55 }, { name: 'TypeScript', mastery: 40 }],
    [{ name: 'React Hooks', mastery: 35 }, { name: 'State Management', mastery: 28 }],
    [{ name: 'Performance', mastery: 0 }, { name: 'Testing', mastery: 0 }],
  ],
  backend: [
    [{ name: 'Node.js', mastery: 80 }, { name: 'HTTP/REST', mastery: 72 }],
    [{ name: 'Express.js', mastery: 60 }, { name: 'PostgreSQL', mastery: 42 }],
    [{ name: 'SQL Joins', mastery: 42 }, { name: 'ORM', mastery: 35 }],
    [{ name: 'Auth & JWT', mastery: 25 }, { name: 'Caching', mastery: 0 }],
  ],
};

function masteryColor(m: number) {
  if (m === 0) return '#94a3b8';
  if (m < 40) return 'var(--skill-weak)';
  if (m < 70) return 'var(--skill-mid)';
  return 'var(--skill-strong)';
}

export default async function CategoryPage({ params }: PageProps<'/categories/[track]'>) {
  const { track } = await params;
  const meta = TRACK_META[track] ?? TRACK_META.frontend;
  const roadmap = SKILL_ROADMAP[track] ?? SKILL_ROADMAP.frontend;

  const trackCourses = courses.filter((c) => c.track === track).length > 0
    ? courses.filter((c) => c.track === track)
    : courses.slice(0, 4);

  return (
    <div>
      {/* Hero banner */}
      <div className="py-16 px-6 text-center" style={{ background: meta.color + '14' }}>
        <span className="text-5xl mb-3 block">{meta.icon}</span>
        <h1 className="text-4xl font-extrabold mb-3" style={{ color: meta.color }}>{meta.label}</h1>
        <p className="max-w-lg mx-auto text-base" style={{ color: 'var(--muted-foreground)' }}>{meta.desc}</p>
        <div className="flex items-center justify-center gap-6 mt-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <span><strong style={{ color: 'var(--foreground)' }}>{trackCourses.length}</strong> khoá học</span>
          <span><strong style={{ color: 'var(--foreground)' }}>12,000+</strong> học viên</span>
          <span><strong style={{ color: 'var(--foreground)' }}>{roadmap.flat().length}</strong> kỹ năng</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* Best sellers */}
        <section>
          <h2 className="text-xl font-extrabold mb-4" style={{ color: 'var(--foreground)' }}>
            Khoá học bán chạy nhất
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trackCourses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>

        {/* Skill roadmap */}
        <section>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: 'var(--foreground)' }}>Lộ trình kỹ năng</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
            Màu sắc thể hiện mức độ thành thạo trung bình của học viên trên SkillPath
          </p>

          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-4">
              {roadmap.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-3">
                  {ci > 0 && (
                    <div className="flex items-center text-lg" style={{ color: 'var(--muted-foreground)', alignSelf: 'center', marginLeft: -24, marginRight: 8 }}>→</div>
                  )}
                  {col.map((skill) => (
                    <div
                      key={skill.name}
                      className="w-36 px-3 py-2.5 rounded-xl border-2 text-center"
                      style={{
                        borderColor: masteryColor(skill.mastery),
                        background: masteryColor(skill.mastery) + '1a',
                      }}
                    >
                      <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{skill.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: masteryColor(skill.mastery) }}>
                        {skill.mastery === 0 ? 'Chưa học' : `${skill.mastery}%`}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {[
              { color: 'var(--skill-weak)', label: 'Cần cải thiện (<40%)' },
              { color: 'var(--skill-mid)', label: 'Đang phát triển (40-70%)' },
              { color: 'var(--skill-strong)', label: 'Thành thạo (≥70%)' },
              { color: '#94a3b8', label: 'Chưa học' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* Browse all */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>Tất cả khoá học</h2>
            <Link href="/search" className="text-sm text-blue-600 hover:underline">Xem tất cả →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
