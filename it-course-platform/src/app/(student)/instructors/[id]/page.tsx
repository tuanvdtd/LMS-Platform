import type { Metadata } from 'next';
import Image from 'next/image';
import { Globe, Star, Users, BookOpen } from 'lucide-react';
import { instructors, courses } from '@/lib/mocks/data';
import { CourseCard, RatingStars } from '@/components/shared/product-ui';

export const metadata: Metadata = { title: 'Hồ sơ giảng viên | SkillPath' };

export default async function InstructorPublicPage({ params }: PageProps<'/instructors/[id]'>) {
  const { id } = await params;
  const instructor = instructors.find((i) => i.id === id) ?? instructors[0];
  const instructorCourses = courses.filter((c) => c.instructor?.id === instructor.id);
  const displayCourses = instructorCourses.length > 0 ? instructorCourses : courses.slice(0, 3);

  const totalStudents = displayCourses.reduce((acc, c) => acc + c.studentCount, 0);
  const avgRating = (displayCourses.reduce((acc, c) => acc + c.rating, 0) / Math.max(displayCourses.length, 1)).toFixed(1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
        <Image
          src={instructor.avatar}
          alt={instructor.name}
          width={112}
          height={112}
          className="w-28 h-28 rounded-full object-cover border-4"
          style={{ borderColor: 'var(--border)' }}
        />
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--foreground)' }}>{instructor.name}</h1>
          <p className="text-base mt-1" style={{ color: 'var(--muted-foreground)' }}>{instructor.title}</p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-5 mt-4 text-sm">
            <div className="flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
              <Star size={15} className="text-yellow-500 fill-yellow-500" />
              <strong>{avgRating}</strong>
              <span style={{ color: 'var(--muted-foreground)' }}>đánh giá trung bình</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
              <Users size={15} className="text-blue-500" />
              <strong>{totalStudents.toLocaleString()}</strong>
              <span style={{ color: 'var(--muted-foreground)' }}>học viên</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
              <BookOpen size={15} className="text-purple-500" />
              <strong>{displayCourses.length}</strong>
              <span style={{ color: 'var(--muted-foreground)' }}>khoá học</span>
            </div>
          </div>

          {/* Social links */}
          <div className="flex gap-3 mt-4">
            {[
              { icon: Globe, label: 'Website', href: '#' },
            ].map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <Icon size={14} style={{ color: 'var(--muted-foreground)' }} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main: bio + courses */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bio */}
          <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h2 className="font-bold mb-3" style={{ color: 'var(--foreground)' }}>Giới thiệu</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              {instructor.bio}
            </p>
          </div>

          {/* Courses */}
          <div>
            <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--foreground)' }}>
              Khoá học ({displayCourses.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayCourses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: ratings */}
        <div className="space-y-5">
          <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h2 className="font-bold mb-4" style={{ color: 'var(--foreground)' }}>Đánh giá từ học viên</h2>

            {/* Overall */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl font-extrabold" style={{ color: 'var(--foreground)' }}>{avgRating}</span>
              <div>
                <RatingStars rating={Number(avgRating)} size="md" />
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {totalStudents.toLocaleString()} đánh giá
                </p>
              </div>
            </div>

            {/* Distribution */}
            {[5, 4, 3, 2, 1].map((star) => {
              const pct = star === 5 ? 62 : star === 4 ? 24 : star === 3 ? 9 : star === 2 ? 3 : 2;
              return (
                <div key={star} className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs w-4" style={{ color: 'var(--muted-foreground)' }}>{star}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                    <div className="h-full rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs w-6 text-right" style={{ color: 'var(--muted-foreground)' }}>{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Recent reviews */}
          <div className="border rounded-2xl p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Đánh giá gần đây</h2>
            {[
              { name: 'Quốc Bảo', time: '2 ngày trước', rating: 5, comment: 'Khoá học cực kỳ chất lượng, nội dung thực tế và dễ hiểu. Giảng viên giải thích rất rõ ràng.' },
              { name: 'Thu Hà', time: '1 tuần trước', rating: 4, comment: 'Nội dung tốt, chỉ mong có thêm bài tập thực hành.' },
            ].map(({ name, time, rating, comment }) => (
              <div key={name} className="pb-4 last:pb-0 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{name}</span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{time}</span>
                </div>
                <RatingStars rating={rating} size="sm" />
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
