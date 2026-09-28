'use client';

import { useState } from 'react';
import { courses, demoStudent } from '@/lib/mocks/data';
import { CourseCard } from '@/components/shared/product-ui';
import { BookOpen } from 'lucide-react';

const TABS = ['Tất cả', 'Đang học', 'Đã hoàn thành', 'Yêu thích'];

export default function MyLearningView() {
  const [tab, setTab] = useState(0);

  const enrolled = courses.filter((c) => demoStudent.enrolledCourses.includes(c.id));
  const completed = courses.filter((c) => demoStudent.completedCourses.includes(c.id));
  const inProgress = enrolled.filter((c) => !demoStudent.completedCourses.includes(c.id));

  const displayed = tab === 0 ? enrolled : tab === 1 ? inProgress : tab === 2 ? completed : [];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-6" style={{ color: 'var(--foreground)' }}>
        Học tập của tôi
      </h1>

      {/* Tabs */}
      <div className="flex border-b mb-6" style={{ borderColor: 'var(--border)' }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderColor: tab === i ? 'var(--primary)' : 'transparent',
              color: tab === i ? 'var(--primary)' : 'var(--muted-foreground)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={40} className="mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-lg mb-2" style={{ color: 'var(--muted-foreground)' }}>
            {tab === 3 ? 'Chưa có khoá học yêu thích' : 'Chưa có khoá học nào'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayed.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              progress={demoStudent.completedCourses.includes(c.id) ? 100 : 34}
            />
          ))}
        </div>
      )}
    </div>
  );
}
