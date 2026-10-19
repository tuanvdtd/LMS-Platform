// Dữ liệu giả cho tab Hỏi đáp của trang học bài — thay bằng API khi có.
// Xoá là xoá cứng trong DB (cả nhánh con), nên không có trạng thái "đã xoá".
export type QaStatus = 'sent' | 'sending' | 'failed';

export interface QaComment {
  id: string;
  author: { name: string; avatar: string | null; isInstructor?: boolean; isMe?: boolean };
  content: string;
  createdAt: string; // ISO
  status: QaStatus;
  replies: QaComment[];
}

const avatar = (g: 'men' | 'women', n: number) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`;
const ME = { name: 'Hoàng Anh', avatar: avatar('men', 32), isMe: true };
const INSTRUCTOR = { name: 'Nguyễn Thành Long', avatar: avatar('men', 45), isInstructor: true };
const KHOA = { name: 'Minh Khoa', avatar: avatar('men', 12) };
const TRAM = { name: 'Nguyễn Hoàng Bảo Ngọc Trâm', avatar: avatar('women', 44) };

export const MOCK_LESSON_QA: QaComment[] = [
  {
    id: 'q1', author: KHOA, status: 'sent', createdAt: '2026-10-19T08:12:00+07:00',
    content: 'Tại sao effect chạy hai lần khi bật StrictMode? Em để dependency array rỗng [] rồi mà console vẫn log 2 lần, có phải lỗi không ạ?',
    replies: [
      {
        id: 'r1', author: INSTRUCTOR, status: 'sent', createdAt: '2026-10-19T09:03:00+07:00',
        content: 'Không phải lỗi em nhé. Ở chế độ development, StrictMode cố ý mount → unmount → mount lại component để lộ ra effect thiếu cleanup.\nBản build production chỉ chạy một lần.',
        replies: [
          {
            id: 'r1a', author: KHOA, status: 'sent', createdAt: '2026-10-19T09:05:00+07:00',
            content: 'Vậy em có nên tắt StrictMode đi cho đỡ rối không ạ?',
            replies: [
              {
                id: 'r1b', author: INSTRUCTOR, status: 'sent', createdAt: '2026-10-19T09:23:00+07:00',
                content: 'Không nên tắt. Thêm hàm cleanup trả về từ effect là log trùng sẽ vô hại, và em bắt được lỗi rò rỉ sớm.',
                replies: [
                  {
                    id: 'r1c', author: TRAM, status: 'sent', createdAt: '2026-10-19T09:51:00+07:00',
                    content: 'Cảm ơn thầy, em cũng gặp y hệt với fetch API, thêm AbortController trong cleanup là hết.',
                    replies: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'r2', author: { name: 'Quốc Bảo', avatar: null }, status: 'sent', createdAt: '2026-10-19T09:18:00+07:00',
        content: 'Có ai có link tài liệu chính thức về StrictMode không?',
        replies: [],
      },
      {
        id: 'r3', author: ME, status: 'sending', createdAt: '2026-10-19T10:03:00+07:00',
        content: 'Mình cũng gặp, thêm cleanup là hết log trùng.',
        replies: [],
      },
    ],
  },
  {
    id: 'q2', author: TRAM, status: 'sent', createdAt: '2026-10-18T21:40:00+07:00',
    content: 'Gọi API trong useEffect thì nên dùng async trực tiếp hay tạo hàm bên trong?',
    replies: [],
  },
  {
    id: 'q3', author: ME, status: 'failed', createdAt: '2026-10-19T10:02:00+07:00',
    content: 'Thầy cho em hỏi useEffect có thay được componentDidUpdate hoàn toàn không ạ?',
    replies: [],
  },
];
