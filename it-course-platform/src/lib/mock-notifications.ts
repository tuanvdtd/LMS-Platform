// Dữ liệu giả cho trang /notifications và panel chuông — thay bằng API khi có.
export type NotifType = 'verdict' | 'course' | 'reminder' | 'system' | 'enrollment' | 'question' | 'review';
// Thông báo gửi cho vai trò nào — panel chuông tách tab theo trường này.
export type NotifAudience = 'student' | 'instructor';

export interface Notif {
  id: string;
  type: NotifType;
  audience: NotifAudience;
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
    audience: 'student',
    title: 'Kết quả chấm bài',
    body: 'Bài "Xây dựng useDebounce Hook" — Accepted 5/5 test cases ✓',
    time: '2 phút trước',
    read: false,
    verdict: 'AC',
  },
  {
    id: 'n2',
    type: 'verdict',
    audience: 'student',
    title: 'Kết quả chấm bài',
    body: 'Bài "SQL: Tìm học viên điểm cao nhất" — Wrong Answer (test 3/5)',
    time: '1 giờ trước',
    read: false,
    verdict: 'WA',
  },
  {
    id: 'n3',
    type: 'course',
    audience: 'student',
    title: 'Bài học mới',
    body: 'React Mastery: Chương 4.3 "Suspense & Concurrent Mode" vừa được đăng.',
    time: '3 giờ trước',
    read: false,
  },
  {
    id: 'n4',
    type: 'reminder',
    audience: 'student',
    title: 'Nhắc học hàng ngày',
    body: 'Hôm nay bạn chưa học! Mục tiêu của bạn là 30 phút/ngày.',
    time: '8 giờ trước',
    read: true,
  },
  {
    id: 'n5',
    type: 'course',
    audience: 'student',
    title: 'Khoá học sắp hết hạn giảm',
    body: 'Node.js Backend Chuyên Sâu: ưu đãi 40% còn 2 ngày.',
    time: '1 ngày trước',
    read: true,
  },
  {
    id: 'n6',
    type: 'system',
    audience: 'student',
    title: 'Cập nhật hệ thống',
    body: 'Tính năng chấm code bằng Python đã được nâng cấp lên CPython 3.12.',
    time: '3 ngày trước',
    read: true,
  },
  {
    id: 'i1',
    type: 'question',
    audience: 'instructor',
    title: 'Câu hỏi mới trong Hỏi đáp',
    body: 'Minh Khoa hỏi ở bài "useEffect và gọi API": Tại sao effect chạy hai lần khi bật StrictMode, có phải lỗi không ạ?',
    time: '15 phút trước',
    read: false,
  },
  {
    id: 'i2',
    type: 'enrollment',
    audience: 'instructor',
    title: '3 học viên mới ghi danh',
    body: 'React thực chiến cho người mới vừa có thêm 3 học viên.',
    time: '2 giờ trước',
    read: false,
  },
  {
    id: 'i3',
    type: 'review',
    audience: 'instructor',
    title: 'Đánh giá mới 4★ cho khoá Node.js Backend Chuyên Sâu: xây dựng REST API, xác thực JWT và triển khai lên Docker',
    body: 'Bài giảng rõ ràng, phần Docker hơi nhanh.',
    time: '1 ngày trước',
    read: true,
  },
  {
    id: 'i4',
    type: 'system',
    audience: 'instructor',
    title: 'Khoá học bị từ chối',
    body: 'Node.js Backend Pro cần chỉnh sửa: thiếu mô tả kết quả học tập.',
    time: '2 ngày trước',
    read: true,
  },
];
