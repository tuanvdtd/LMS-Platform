'use client';

import { useState } from 'react';
import { courses } from '@/lib/mocks/data';
import { CourseCard } from '@/components/shared/product-ui';

const TRACKS = [
  { id: 'frontend', label: 'Frontend', emoji: '⚡', color: '#3b82f6' },
  { id: 'backend', label: 'Backend', emoji: '⚙️', color: '#8b5cf6' },
  { id: 'fullstack', label: 'Fullstack', emoji: '🔗', color: '#06b6d4' },
  { id: 'data', label: 'Data & AI', emoji: '📊', color: '#f59e0b' },
  { id: 'devops', label: 'DevOps', emoji: '🚀', color: '#10b981' },
  { id: 'mobile', label: 'Mobile', emoji: '📱', color: '#f43f5e' },
];

export default function FeaturedCourses() {
  const [activeTrack, setActiveTrack] = useState('frontend');
  const trackCourses = courses.filter((c) => c.track === activeTrack);

  return (
    <section>
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
        Khoá học nổi bật
      </h2>
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTrack(t.id)}
            className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
            style={{
              background: activeTrack === t.id ? t.color : 'var(--card)',
              color: activeTrack === t.id ? '#fff' : 'var(--foreground)',
              borderColor: activeTrack === t.id ? t.color : 'var(--border)',
            }}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
      {trackCourses.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {trackCourses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
          Chưa có khoá học trong track này
        </div>
      )}
    </section>
  );
}
