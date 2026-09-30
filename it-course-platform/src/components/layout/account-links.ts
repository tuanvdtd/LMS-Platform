import { Award, BarChart2, BookOpen, Briefcase, Settings } from 'lucide-react';

// Dùng chung cho dropdown avatar (desktop) và drawer (mobile).
export const accountLinks = [
  { icon: BookOpen, label: 'Học tập của tôi', to: '/my-learning' },
  { icon: BarChart2, label: 'Hồ sơ năng lực', to: '/skills' },
  { icon: Award, label: 'Chứng chỉ', to: '/certificates' },
  { icon: Briefcase, label: 'Lịch sử mua hàng', to: '/orders' },
  { icon: Settings, label: 'Cài đặt', to: '/settings' },
] as const;
