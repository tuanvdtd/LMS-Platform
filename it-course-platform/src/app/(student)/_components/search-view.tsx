'use client';

import { useState } from 'react';
import { courses } from '@/lib/mocks/data';
import { CourseCard } from '@/components/shared/product-ui';

const TRACKS = ['Tất cả', 'Frontend', 'Backend', 'Fullstack', 'Data', 'DevOps', 'Mobile'];
const LEVELS = ['Tất cả', 'Mới bắt đầu', 'Cơ bản', 'Trung cấp', 'Nâng cao'];
const RATINGS = ['4.5+', '4.0+', '3.5+'];

export default function SearchView({ query }: { query: string }) {
  const [track, setTrack] = useState(0);
  const [level, setLevel] = useState(0);
  const [sort, setSort] = useState('relevant');

  const filtered = courses.filter((c) => {
    if (track > 0) {
      const t = TRACKS[track].toLowerCase();
      if (c.track !== t) return false;
    }
    return !query || c.title.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          {query ? (
            <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>
              Kết quả tìm kiếm: &quot;<span className="text-blue-600">{query}</span>&quot;
            </h1>
          ) : (
            <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>Tất cả khoá học</h1>
          )}
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{filtered.length} khoá học</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5"
            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
          >
            <option value="relevant">Phù hợp nhất</option>
            <option value="popular">Phổ biến nhất</option>
            <option value="rating">Đánh giá cao nhất</option>
            <option value="newest">Mới nhất</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters */}
        <aside className="hidden lg:block w-52 shrink-0 space-y-6">
          <div>
            <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--foreground)' }}>Track</h3>
            <div className="space-y-1.5">
              {TRACKS.map((t, i) => (
                <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="track"
                    checked={track === i}
                    onChange={() => setTrack(i)}
                    className="accent-blue-600"
                  />
                  <span style={{ color: 'var(--foreground)' }}>{t}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--foreground)' }}>Trình độ</h3>
            <div className="space-y-1.5">
              {LEVELS.map((l, i) => (
                <label key={l} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="level"
                    checked={level === i}
                    onChange={() => setLevel(i)}
                    className="accent-blue-600"
                  />
                  <span style={{ color: 'var(--foreground)' }}>{l}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--foreground)' }}>Đánh giá</h3>
            <div className="space-y-1.5">
              {RATINGS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="accent-blue-600" />
                  <span className="text-amber-500">★</span>
                  <span style={{ color: 'var(--foreground)' }}>{r}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="accent-blue-600" />
              <span style={{ color: 'var(--foreground)' }}>Có bài tập lập trình</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer mt-1.5">
              <input type="checkbox" className="accent-blue-600" />
              <span style={{ color: 'var(--foreground)' }}>Có chứng chỉ</span>
            </label>
          </div>
        </aside>

        {/* Course list */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'var(--muted-foreground)' }}>
              <p className="text-lg">Không tìm thấy khoá học phù hợp</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
