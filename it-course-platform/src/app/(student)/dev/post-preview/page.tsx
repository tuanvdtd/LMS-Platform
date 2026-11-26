import { notFound } from 'next/navigation';
import { PostArticle } from '@/components/post/post-article';
import type { PostCard, PostDetail } from '@/types/post';

// Bài mẫu đủ mọi thành phần của trang đọc để soi giao diện. Chỉ chạy ở dev (prod trả 404).
const img = (id: string, w: number, h?: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=75`;

const BODY = `
<p>Hầu hết lỗi liên quan tới <code>useEffect</code> không đến từ cú pháp mà đến từ cách nghĩ. Ta quen coi nó là "chạy đoạn này khi component hiện lên", trong khi React thiết kế nó để <strong>đồng bộ component với một hệ thống bên ngoài</strong>. Đổi được cách nghĩ này thì phần lớn lỗi <em>vòng lặp vô hạn</em> và <mark>dữ liệu cũ</mark> tự biến mất.</p>
<p>Bài này đi qua ba ý: effect thật ra là gì, mảng phụ thuộc hoạt động thế nào, và khi nào bạn <a href="https://react.dev/learn/you-might-not-need-an-effect">không cần effect</a>.</p>
<h2>Effect là đồng bộ, không phải vòng đời</h2>
<p>Mỗi lần render, React chụp lại props và state tại thời điểm đó. Effect của lần render ấy chỉ nhìn thấy đúng ảnh chụp đó. Vì vậy câu hỏi đúng không phải "effect chạy lúc nào" mà là "effect này giữ cái gì khớp với cái gì".</p>
<pre><code class="language-tsx">function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState&lt;Message[]&gt;([]);

  useEffect(() =&gt; {
    const connection = createConnection(roomId);
    connection.on('message', (m) =&gt; setMessages((prev) =&gt; [...prev, m]));
    connection.connect();
    return () =&gt; connection.disconnect(); // dọn kết nối của roomId cũ
  }, [roomId]);

  return &lt;MessageList items={messages} /&gt;;
}</code></pre>
<aside data-callout="note"><p>Hàm dọn dẹp chạy trước khi effect chạy lại với giá trị mới, và một lần nữa khi component bị gỡ. Ở chế độ Strict Mode, React cố ý chạy effect hai lần lúc phát triển để bạn phát hiện effect thiếu dọn dẹp.</p></aside>
<img src="${img('photo-1555066931-4365d14bab8c', 1400)}" alt="Màn hình hiển thị mã nguồn JavaScript" title="Ảnh ngang lớn (1400px): rộng bằng cột chữ.">
<h3>Mỗi lần render có effect riêng</h3>
<p>Hàm truyền vào <code>useEffect</code> là một hàm mới ở mỗi lần render. Nó đóng gói giá trị của lần render đó, nên không có chuyện effect "đọc nhầm" state của lần sau.</p>
<blockquote><p>Đừng hỏi effect chạy khi nào. Hãy hỏi: với những giá trị này, bên ngoài cần ở trạng thái nào.</p></blockquote>
<img src="${img('photo-1461749280684-dccba630e2f6', 600, 400)}" alt="Trình soạn mã mở nhiều tệp" title="Ảnh ngang nhỏ (600×400): được phóng lên bằng cột chữ.">
<h2>Mảng phụ thuộc không phải công tắc</h2>
<p>Mảng phụ thuộc mô tả những giá trị mà effect đọc. Nó không phải nơi để bạn chọn "muốn chạy lại khi nào". Bỏ bớt một giá trị để effect chạy ít hơn là cách nhanh nhất tạo ra lỗi dữ liệu cũ.</p>
<ol>
<li><p>Liệt kê mọi giá trị trong component mà effect dùng tới.</p></li>
<li><p>Nếu danh sách đó làm effect chạy quá nhiều, hãy sửa <strong>code</strong>, không sửa danh sách.</p></li>
<li><p>Bật quy tắc lint <code>react-hooks/exhaustive-deps</code> và đừng tắt nó.</p></li>
</ol>
<aside data-callout="warning"><p>Object và hàm tạo trong thân component là giá trị mới ở mỗi lần render. Đưa chúng vào mảng phụ thuộc thì effect chạy lại liên tục. Hãy chuyển chúng vào trong effect hoặc ra ngoài component.</p></aside>
<h3>Kiểm tra nhanh bằng lint</h3>
<pre><code class="language-bash">pnpm add -D eslint-plugin-react-hooks
pnpm exec eslint "src/**/*.{ts,tsx}" --rule 'react-hooks/exhaustive-deps: error' --max-warnings 0</code></pre>
<table><tbody>
<tr><th><p>Mảng phụ thuộc</p></th><th><p>Effect chạy</p></th><th><p>Dùng khi</p></th></tr>
<tr><td><p>Không truyền</p></td><td><p>Sau mọi lần render</p></td><td><p>Hiếm khi đúng</p></td></tr>
<tr><td><p><code>[]</code></p></td><td><p>Một lần sau lần render đầu</p></td><td><p>Effect không đọc giá trị nào của component</p></td></tr>
<tr><td><p><code>[a, b]</code></p></td><td><p>Khi <code>a</code> hoặc <code>b</code> đổi</p></td><td><p>Trường hợp thông thường</p></td></tr>
</tbody></table>
<img src="${img('photo-1512941937669-90a1b58e7e9c', 720, 1280)}" alt="Ảnh chụp màn hình điện thoại" title="Ảnh dọc (720×1280): khung rộng bằng cột, ảnh nằm giữa, không méo.">
<h2>Khi nào bạn không cần effect</h2>
<p>Effect là lối thoát ra khỏi React. Nếu không có hệ thống bên ngoài nào (mạng, DOM, bộ hẹn giờ, thư viện khác) thì gần như chắc chắn bạn không cần nó.</p>
<ul>
<li><p><strong>Tính dữ liệu từ props hoặc state:</strong> tính ngay trong lúc render.</p></li>
<li><p><strong>Phản ứng với thao tác của người dùng:</strong> viết trong hàm xử lý sự kiện.</p></li>
<li><p><strong>Đặt lại state khi prop đổi:</strong> dùng <code>key</code> để React tạo lại component.</p></li>
</ul>
<aside data-callout="tip"><p>Gặp cặp <code>useState</code> + <code>useEffect</code> chỉ để sao chép một giá trị sang giá trị khác, hãy xoá cả hai và thay bằng một biến tính trực tiếp.</p></aside>
<hr>
<p style="text-align: center;">Tóm lại: nghĩ theo hướng đồng bộ, khai đủ phụ thuộc, và bỏ effect khi không có gì bên ngoài để đồng bộ.</p>
`;

const author = { id: '0192f0c0-0000-7000-8000-000000000001', name: 'Trần Minh Khoa', image: null };
const other = { id: '0192f0c0-0000-7000-8000-000000000002', name: 'Lê Thu Hà', image: null };

const card = (n: number, title: string, photo: string | null, minutes: number, by = author): PostCard => ({
  id: `mau-${n}`,
  slug: `bai-mau-${n}`,
  title,
  excerpt: '',
  coverUrl: photo && img(photo, 800),
  readingMinutes: minutes,
  // Vài bài 0 tim 0 bình luận để thấy thẻ không hiện số.
  likeCount: n % 3 === 0 ? 0 : n * 4,
  commentCount: n % 3 === 0 ? 0 : n,
  publishedAt: `2026-11-0${n}T02:00:00.000Z`,
  topics: [{ slug: 'react', name: 'React' }],
  author: by,
});

const SAMPLE: PostDetail = {
  id: 'mau',
  slug: 'hieu-dung-ve-useeffect-trong-react',
  title: 'Hiểu đúng về useEffect trong React',
  excerpt:
    'useEffect không phải "chạy khi component hiện lên". Nó là công cụ đồng bộ component với thế giới bên ngoài, và hiểu vậy thì hết lỗi vòng lặp.',
  coverUrl: img('photo-1517694712202-14dd9538aa97', 2000),
  readingMinutes: 7,
  likeCount: 12,
  commentCount: 5,
  publishedAt: '2026-11-10T02:00:00.000Z',
  updatedAt: '2026-11-15T08:30:00.000Z',
  topics: [
    { slug: 'react', name: 'React' },
    { slug: 'javascript', name: 'JavaScript' },
  ],
  author: {
    ...author,
    headline: 'Kỹ sư frontend, giảng viên React',
    bio: 'Tám năm làm frontend, hiện dạy React và TypeScript. Viết về những chỗ tài liệu nói ngắn nhưng người mới hay vấp.',
  },
  bodyHtml: BODY,
  relatedCourse: {
    id: 'course-mau',
    slug: 'react-tu-co-ban-den-nang-cao',
    title: 'React từ cơ bản đến nâng cao',
    subtitle: 'Hook, quản lý state và tối ưu hiệu năng qua dự án thật',
    thumbnailUrl: img('photo-1498050108023-c5249f4df085', 800),
    priceAmount: 499000,
    currency: 'VND',
    level: 'intermediate',
    ratingAvg: 4.7,
    ratingCount: 128,
    enrollmentCount: 1540,
    lectureCount: 86,
    totalDurationSec: 52200,
    instructor: { id: author.id, name: author.name },
  },
  fromAuthor: [
    card(1, 'useMemo và useCallback: khi nào thật sự cần', 'photo-1516116216624-53e697fedbea', 6),
    card(2, 'Quản lý state trên server với React Query', null, 9),
    card(3, 'Server Components thay đổi cách ta lấy dữ liệu thế nào', 'photo-1504639725590-34d0984388bd', 11),
  ],
  more: [
    card(4, 'Context API: chia sẻ state mà không truyền props qua nhiều tầng', 'photo-1587620962725-abab7fe55159', 5, other),
    card(5, 'Viết custom hook gọn gàng cho form', 'photo-1551033406-611cf9a28f67', 8, other),
    card(6, 'Đọc hiểu thông báo lỗi hydration của Next.js', null, 4, other),
    card(7, 'TypeScript cho component React: props, generic và children', 'photo-1542831371-29b0f74f9713', 10, other),
  ],
};

export default function PostPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <PostArticle post={SAMPLE} preview />;
}
