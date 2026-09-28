export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  sentAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantRole: 'student' | 'instructor';
  participantTitle?: string;
  courseContext?: string;
  messages: ChatMessage[];
  unread: number;
}

// Student side: conversations with instructors
export const studentConversations: Conversation[] = [
  {
    id: 'conv-1',
    participantId: 'ins-1',
    participantName: 'Nguyễn Thành Long',
    participantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop',
    participantRole: 'instructor',
    participantTitle: 'Senior Frontend Engineer · VNG',
    courseContext: 'React Mastery: Từ cơ bản đến nâng cao',
    unread: 1,
    messages: [
      { id: 'm1', senderId: 'me', text: 'Thầy ơi, em đang học bài về useCallback thì không hiểu tại sao nó lại cần thiết khi đã có useMemo rồi. Hai cái này khác nhau như thế nào ạ?', sentAt: '10:12', read: true },
      { id: 'm2', senderId: 'ins-1', text: 'Câu hỏi hay! useMemo dùng để cache giá trị tính toán, còn useCallback dùng để cache tham chiếu hàm. Khi bạn truyền callback xuống component con dùng React.memo, nếu không có useCallback thì mỗi lần render cha sẽ tạo ra hàm mới → con re-render dù props không đổi.', sentAt: '10:25', read: true },
      { id: 'm3', senderId: 'me', text: 'Ồ em hiểu rồi! Vậy chỉ cần dùng useCallback khi truyền hàm vào component con đã được wrap bằng React.memo phải không ạ?', sentAt: '10:28', read: true },
      { id: 'm4', senderId: 'ins-1', text: 'Chính xác! Hoặc khi hàm đó là dependency trong useEffect/useMemo của component con. Trong các trường hợp khác thì không cần thiết, thậm chí còn tốn thêm bộ nhớ.', sentAt: '10:31', read: false },
    ],
  },
  {
    id: 'conv-2',
    participantId: 'ins-2',
    participantName: 'Trần Minh Tuấn',
    participantAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop',
    participantRole: 'instructor',
    participantTitle: 'Backend Engineer · Tiki',
    courseContext: 'Node.js Backend Chuyên Sâu',
    unread: 0,
    messages: [
      { id: 'm5', senderId: 'me', text: 'Thầy ơi cho em hỏi: khi dùng connection pooling với PostgreSQL thì nên đặt pool size bao nhiêu là hợp lý ạ?', sentAt: 'Hôm qua', read: true },
      { id: 'm6', senderId: 'ins-2', text: 'Rule of thumb: pool_size = (số CPU core × 2) + số ổ đĩa. Nhưng quan trọng hơn là cần monitor actual connection wait time. Nếu app của bạn chủ yếu I/O bound thì có thể tăng thêm, CPU bound thì giữ thấp.', sentAt: 'Hôm qua', read: true },
      { id: 'm7', senderId: 'me', text: 'Cảm ơn thầy! Em sẽ thử với 2*CPU + 2 trước rồi monitor thêm.', sentAt: 'Hôm qua', read: true },
    ],
  },
  {
    id: 'conv-3',
    participantId: 'ins-3',
    participantName: 'Lê Thị Hoa',
    participantAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=48&h=48&fit=crop',
    participantRole: 'instructor',
    participantTitle: 'Data Engineer · Shopee',
    courseContext: 'SQL Mastery & Database Design',
    unread: 2,
    messages: [
      { id: 'm8', senderId: 'ins-3', text: 'Chào Khoa! Cô thấy bạn đang học đến phần Window Functions rồi. Bạn có thắc mắc gì không? Phần này nhiều bạn hay nhầm giữa RANK() và DENSE_RANK() lắm.', sentAt: '2 ngày trước', read: true },
      { id: 'm9', senderId: 'me', text: 'Dạ cô, em đang thắc mắc đúng chỗ đó. RANK() bỏ qua số thứ tự còn DENSE_RANK() thì liên tục đúng không ạ?', sentAt: '2 ngày trước', read: true },
      { id: 'm10', senderId: 'ins-3', text: 'Đúng! Ví dụ 3 người cùng điểm 100: RANK() cho 1,1,1,4 còn DENSE_RANK() cho 1,1,1,2. Dùng cái nào tuỳ ngữ cảnh — báo cáo ranking thường dùng RANK(), phân nhóm tier thường dùng DENSE_RANK().', sentAt: '2 ngày trước', read: false },
      { id: 'm11', senderId: 'ins-3', text: 'Bạn thử làm bài tập thực hành số 4 trong chương 5 đi nhé, mình thiết kế bài đó để luyện đúng 2 hàm này.', sentAt: '2 ngày trước', read: false },
    ],
  },
];

// Instructor side: conversations with students
export const instructorConversations: Conversation[] = [
  {
    id: 'iconv-1',
    participantId: 'stu-1',
    participantName: 'Nguyễn Minh Khoa',
    participantAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=48&h=48&fit=crop',
    participantRole: 'student',
    courseContext: 'React Mastery: Từ cơ bản đến nâng cao',
    unread: 1,
    messages: [
      { id: 'im1', senderId: 'stu-1', text: 'Thầy ơi, em đang học bài về useCallback thì không hiểu tại sao nó lại cần thiết khi đã có useMemo rồi.', sentAt: '10:12', read: true },
      { id: 'im2', senderId: 'me', text: 'useMemo cache giá trị, useCallback cache tham chiếu hàm. Khi truyền callback xuống component con React.memo thì cần useCallback để tránh re-render.', sentAt: '10:25', read: true },
      { id: 'im3', senderId: 'stu-1', text: 'Ồ em hiểu rồi! Cảm ơn thầy!', sentAt: '10:31', read: false },
    ],
  },
  {
    id: 'iconv-2',
    participantId: 'stu-2',
    participantName: 'Trần Thị Thu Hà',
    participantAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop',
    participantRole: 'student',
    courseContext: 'React Mastery: Từ cơ bản đến nâng cao',
    unread: 0,
    messages: [
      { id: 'im4', senderId: 'stu-2', text: 'Thầy ơi em muốn hỏi về project cuối khoá có thể dùng Next.js thay vì CRA không ạ?', sentAt: 'Hôm qua', read: true },
      { id: 'im5', senderId: 'me', text: 'Được chứ! Thậm chí Next.js còn được khuyến khích hơn. Chỉ cần nộp link GitHub repo và demo URL là được.', sentAt: 'Hôm qua', read: true },
    ],
  },
  {
    id: 'iconv-3',
    participantId: 'stu-3',
    participantName: 'Lê Quốc Bảo',
    participantAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=48&h=48&fit=crop',
    participantRole: 'student',
    courseContext: 'React Mastery: Từ cơ bản đến nâng cao',
    unread: 3,
    messages: [
      { id: 'im6', senderId: 'stu-3', text: 'Thầy ơi em bị lỗi "Cannot update a component while rendering a different component". Em đã check setState trong render nhưng không thấy.', sentAt: '14:03', read: true },
      { id: 'im7', senderId: 'stu-3', text: 'Em paste code lên đây được không ạ?', sentAt: '14:04', read: false },
      { id: 'im8', senderId: 'stu-3', text: '```jsx\nconst Parent = () => {\n  const [count, setCount] = useState(0);\n  return <Child onChange={setCount(count + 1)} />;\n}```', sentAt: '14:05', read: false },
      { id: 'im9', senderId: 'stu-3', text: 'Thầy có thể xem giúp em với ạ?', sentAt: '14:06', read: false },
    ],
  },
];
