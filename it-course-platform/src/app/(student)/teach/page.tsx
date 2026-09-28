import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, TrendingUp, Users, Award, ChevronRight, DollarSign, BarChart2, MessageSquare } from 'lucide-react';

export const metadata: Metadata = { title: 'Trở thành giảng viên | SkillPath' };

const STATS = [
  { value: '40,000+', label: 'Học viên đang học' },
  { value: '320+', label: 'Khoá học chất lượng' },
  { value: '85%', label: 'Tỷ lệ hoàn thành' },
  { value: '70%', label: 'Doanh thu cho giảng viên' },
];

const FEATURES = [
  { icon: DollarSign, title: 'Thu nhập thụ động', desc: 'Tạo khoá học một lần, nhận doanh thu liên tục. Tỷ lệ chia sẻ doanh thu 70/30 — một trong những mức tốt nhất thị trường Việt Nam.' },
  { icon: BarChart2, title: 'Analytics chuyên sâu', desc: 'Dashboard thống kê xem video, tỷ lệ hoàn thành, kết quả bài kiểm tra giúp bạn cải thiện nội dung theo dữ liệu thực.' },
  { icon: Users, title: 'Cộng đồng học viên', desc: 'Tiếp cận hàng chục nghìn học viên IT đang tìm kiếm khoá học chất lượng về React, Node.js, SQL, DevOps...' },
  { icon: MessageSquare, title: 'Hệ thống hỏi đáp', desc: 'Q&A tích hợp với phân loại câu hỏi, thông báo thời gian thực để bạn tương tác với học viên hiệu quả.' },
  { icon: BookOpen, title: 'Công cụ xây dựng khoá học', desc: 'Trình tạo khoá học trực quan, hỗ trợ video, quiz tự động chấm, bài tập lập trình với judge engine.' },
  { icon: Award, title: 'Chứng chỉ có giá trị', desc: 'Học viên hoàn thành nhận chứng chỉ kỹ thuật số có thể xác minh — tăng uy tín cho khoá học của bạn.' },
];

const STEPS = [
  { n: '01', title: 'Đăng ký tài khoản giảng viên', desc: 'Hoàn thành hồ sơ cá nhân và nộp hồ sơ xác minh chuyên môn.' },
  { n: '02', title: 'Tạo khoá học đầu tiên', desc: 'Sử dụng trình xây dựng khoá học để thêm nội dung, quiz và bài tập.' },
  { n: '03', title: 'Gửi duyệt & xuất bản', desc: 'Đội ngũ kiểm duyệt xem xét trong 3–5 ngày làm việc.' },
  { n: '04', title: 'Nhận doanh thu', desc: 'Khoá học được duyệt sẽ hiển thị trên nền tảng. Doanh thu được thanh toán hàng tháng.' },
];

const TESTIMONIALS = [
  {
    name: 'Trần Anh Tuấn',
    title: 'Senior Frontend Engineer · 3,200 học viên',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=48&h=48&fit=crop',
    quote: 'SkillPath giúp tôi biến kiến thức 8 năm kinh nghiệm thành thu nhập thụ động. Dashboard analytics rất chi tiết, giúp tôi liên tục cải thiện nội dung.',
  },
  {
    name: 'Lê Thị Minh',
    title: 'Data Engineer · 2,800 học viên',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop',
    quote: 'Tính năng bài tập lập trình với auto-judge là điểm khác biệt lớn. Học viên của tôi tiến bộ rõ rệt hơn so với nền tảng khác.',
  },
];

export default function TeachPage() {
  return (
    <div>
      {/* Hero */}
      <div className="py-20 px-6 text-center" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)' }}>
        <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-3">Trở thành giảng viên</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
          Chia sẻ kiến thức —<br />tạo thu nhập bền vững
        </h1>
        <p className="text-blue-100 max-w-xl mx-auto text-lg mb-8">
          Hàng chục nghìn học viên IT đang chờ học từ chuyên gia như bạn.
          Tỷ lệ doanh thu 70% — minh bạch và cạnh tranh nhất thị trường.
        </p>
        <Link
          href="/instructor/verification"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-2xl text-base transition-colors"
        >
          Bắt đầu dạy ngay <ChevronRight size={16} />
        </Link>
      </div>

      {/* Stats */}
      <div className="border-y" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold" style={{ color: 'var(--primary)' }}>{value}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-20">
        {/* Features */}
        <section>
          <h2 className="text-2xl font-extrabold text-center mb-10" style={{ color: 'var(--foreground)' }}>
            Tại sao chọn SkillPath?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="border rounded-2xl p-5 space-y-3 hover:shadow-md transition-shadow"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Icon size={18} className="text-blue-600" />
                </div>
                <p className="font-bold" style={{ color: 'var(--foreground)' }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section>
          <h2 className="text-2xl font-extrabold text-center mb-10" style={{ color: 'var(--foreground)' }}>
            Bắt đầu trong 4 bước
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {STEPS.map(({ n, title, desc }) => (
              <div
                key={n}
                className="flex gap-4 p-5 rounded-2xl border"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              >
                <span className="text-3xl font-extrabold shrink-0" style={{ color: 'var(--primary)', opacity: 0.3 }}>{n}</span>
                <div>
                  <p className="font-bold mb-1" style={{ color: 'var(--foreground)' }}>{title}</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section>
          <h2 className="text-2xl font-extrabold text-center mb-10" style={{ color: 'var(--foreground)' }}>
            Giảng viên nói gì về SkillPath?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TESTIMONIALS.map(({ name, title, avatar, quote }) => (
              <div
                key={name}
                className="border rounded-2xl p-5 space-y-4"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              >
                <p className="text-sm leading-relaxed italic" style={{ color: 'var(--foreground)' }}>&quot;{quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <Image src={avatar} alt={name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center py-12 border rounded-3xl" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <TrendingUp size={36} className="mx-auto mb-4 text-blue-600" />
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--foreground)' }}>Sẵn sàng chia sẻ chuyên môn?</h2>
          <p className="mb-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>Tham gia cùng hơn 150 giảng viên đang tạo ra giá trị trên SkillPath.</p>
          <Link
            href="/instructor/verification"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl transition-colors"
          >
            Đăng ký giảng viên <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
