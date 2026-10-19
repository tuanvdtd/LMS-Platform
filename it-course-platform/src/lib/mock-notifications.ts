// Dữ liệu giả cho trang /notifications và panel chuông — thay bằng API khi có.
export type NotifType = 'verdict' | 'course' | 'reminder' | 'system';

export interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  verdict?: 'AC' | 'WA' | 'TLE';
}

export const MOCK_NOTIFICATIONS: Notif[] = [
  {
    id: 'n1',
    type: 'verdict',
    title: 'Kết quả chấm bài',
    body: 'Bài "Xây dựng useDebounce Hook" — Accepted 5/5 test cases ✓',
    time: '2 phút trước',
    read: false,
    verdict: 'AC',
  },
  {
    id: 'n2',
    type: 'verdict',
    title: 'Kết quả chấm bài',
    body: 'Bài "SQL: Tìm học viên điểm cao nhất" — Wrong Answer (test 3/5)',
    time: '1 giờ trước',
    read: false,
    verdict: 'WA',
  },
  {
    id: 'n3',
    type: 'course',
    title: 'Bài học mới',
    body: 'React Mastery: Chương 4.3 "Suspense & Concurrent Mode" vừa được đăng.',
    time: '3 giờ trước',
    read: false,
  },
  {
    id: 'n4',
    type: 'reminder',
    title: 'Nhắc học hàng ngày',
    body: 'Hôm nay bạn chưa học! Mục tiêu của bạn là 30 phút/ngày.',
    time: '8 giờ trước',
    read: true,
  },
  {
    id: 'n5',
    type: 'course',
    title: 'Khoá học sắp hết hạn giảm',
    body: 'Node.js Backend Chuyên Sâu: ưu đãi 40% còn 2 ngày.',
    time: '1 ngày trước',
    read: true,
  },
  {
    id: 'n6',
    type: 'system',
    title: 'Cập nhật hệ thống',
    body: 'Tính năng chấm code bằng Python đã được nâng cấp lên CPython 3.12.',
    time: '3 ngày trước',
    read: true,
  },
];
