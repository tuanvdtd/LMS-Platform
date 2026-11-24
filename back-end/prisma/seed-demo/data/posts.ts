// Bài blog mẫu của tài khoản đứng tên khoá trình diễn (SEED_SHOWCASE_OWNER). HTML đúng dạng trình soạn Tiptap sinh ra:
// <pre><code class="language-x"> (ngôn ngữ trong gói lowlight common; Dockerfile không có nên để plaintext), <aside data-callout>.
export type SeedPost = {
  title: string;
  excerpt: string;
  topics: string[]; // slug topic, 1–3
  daysAgo: number;
  relatedShowcase?: boolean; // gắn "Khoá liên quan" = khoá trình diễn
  likes: number;
  // draft: bài nháp gần xong để demo luồng xuất bản: không tải ảnh bìa (thiếu đúng một mục trong checklist),
  // `cover` chỉ dùng để xuất file ảnh cho người demo tự tải lên (pnpm seed:blog --cover-dir <thư mục>).
  draft?: true;
  cover: { kicker: string; headline: string; sub: string; bg: string; accent: string };
  body: string;
  // Bình luận gốc của học viên seed; reply = tác giả trả lời.
  comments: { body: string; reply?: string }[];
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const code = (lang: string, src: string) => `<pre><code class="language-${lang}">${esc(src.trim())}</code></pre>`;
const ul = (...items: string[]) => `<ul>${items.map((i) => `<li><p>${i}</p></li>`).join('')}</ul>`;
const ol = (...items: string[]) => `<ol>${items.map((i) => `<li><p>${i}</p></li>`).join('')}</ol>`;
const callout = (kind: 'note' | 'tip' | 'warning', text: string) => `<aside data-callout="${kind}"><p>${text}</p></aside>`;

export const POSTS: SeedPost[] = [
  {
    title: 'Event loop trong JavaScript: vì sao setTimeout(fn, 0) không chạy ngay',
    excerpt:
      'Đoạn code bốn dòng in ra 1, 4, 3, 2 chứ không phải 1, 2, 3, 4. Bài này giải thích call stack, hàng đợi task và microtask để bạn đoán đúng thứ tự chạy của code bất đồng bộ.',
    topics: ['javascript'],
    daysAgo: 26,
    relatedShowcase: true,
    likes: 46,
    cover: { kicker: 'JAVASCRIPT', headline: 'Event loop', sub: 'Task, microtask và thứ tự chạy', bg: '#14161F', accent: '#F7DF1E' },
    body: [
      '<p>Hãy đoán đoạn code dưới đây in ra gì trước khi đọc tiếp:</p>',
      code('javascript', `
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');`),
      '<p>Kết quả là <code>1</code>, <code>4</code>, <code>3</code>, <code>2</code>. Nhiều bạn đoán <code>2</code> đứng thứ hai vì độ trễ là 0 mili giây. Thứ tự thật đến từ cách JavaScript xếp hàng công việc, gọi chung là event loop.</p>',
      '<h2>Call stack chạy hết phần đồng bộ trước</h2>',
      '<p>JavaScript trong trình duyệt chạy trên một luồng. Mọi lời gọi hàm đồng bộ được đẩy vào call stack và chạy cho tới khi stack rỗng. Trong lúc đó không có gì chen ngang được, kể cả một callback đã đến hạn.</p>',
      '<p>Vì vậy hai dòng <code>console.log(\'1\')</code> và <code>console.log(\'4\')</code> luôn chạy trước. <code>setTimeout</code> và <code>.then</code> chỉ đăng ký callback rồi trả về ngay.</p>',
      '<h2>Hai hàng đợi: task và microtask</h2>',
      '<p>Callback bất đồng bộ không chạy ngay mà được xếp vào một trong hai hàng đợi:</p>',
      ul(
        '<strong>Task queue</strong> (còn gọi là macrotask): callback của <code>setTimeout</code>, <code>setInterval</code>, sự kiện click, tin nhắn từ <code>postMessage</code>.',
        '<strong>Microtask queue</strong>: callback của <code>Promise.then</code>, <code>catch</code>, <code>finally</code>, <code>queueMicrotask</code> và phần code phía sau mỗi <code>await</code>.',
      ),
      '<p>Mỗi vòng lặp, event loop lấy <strong>một</strong> task ra chạy. Khi stack rỗng, nó chạy <strong>toàn bộ</strong> microtask đang chờ, kể cả microtask mới sinh ra trong lúc chạy. Sau đó trình duyệt mới có cơ hội vẽ lại màn hình rồi lấy task tiếp theo.</p>',
      '<p>Áp vào ví dụ đầu bài: bản thân script là một task. Chạy xong phần đồng bộ (1, 4), event loop xả microtask (3), rồi mới tới task của <code>setTimeout</code> (2).</p>',
      callout('tip', 'Quy tắc nhớ nhanh: code đồng bộ, rồi toàn bộ microtask, rồi một task, rồi lặp lại. Trình duyệt chỉ vẽ lại giữa các task.'),
      '<h2>await cũng là microtask</h2>',
      '<p><code>async/await</code> được xây trên Promise. Phần code sau <code>await</code> được xếp vào microtask queue, kể cả khi giá trị được await đã có sẵn:</p>',
      code('javascript', `
async function main() {
  console.log('A');
  await null;
  console.log('B');
}

main();
console.log('C');
// In ra: A, C, B`),
      '<p><code>A</code> chạy đồng bộ vì nằm trước <code>await</code>. Gặp <code>await</code>, hàm tạm dừng và trả quyền điều khiển cho nơi gọi, nên <code>C</code> chạy tiếp. <code>B</code> chỉ chạy khi microtask queue được xả.</p>',
      '<h2>Microtask có thể làm đứng trang</h2>',
      '<p>Vì event loop xả microtask cho tới khi hàng đợi rỗng, một microtask liên tục tự sinh microtask mới sẽ không bao giờ nhường cho việc vẽ màn hình:</p>',
      code('javascript', `
function loop() {
  queueMicrotask(loop); // trang đứng hình, không bấm được gì
}
loop();`),
      '<p>Thay <code>queueMicrotask</code> bằng <code>setTimeout</code> thì trang vẫn phản hồi bình thường, vì mỗi lần lặp là một task riêng và trình duyệt được vẽ lại giữa các task.</p>',
      '<h2>Áp dụng: chia nhỏ việc nặng</h2>',
      '<p>Một vòng lặp xử lý 100.000 phần tử chạy liền một mạch sẽ khoá giao diện cho tới khi xong. Hãy chia thành từng lô và nhường lại cho trình duyệt giữa các lô:</p>',
      code('javascript', `
function processInChunks(items, handle, size = 1000) {
  let i = 0;
  function next() {
    const end = Math.min(i + size, items.length);
    for (; i < end; i++) handle(items[i]);
    if (i < items.length) setTimeout(next, 0);
  }
  next();
}`),
      '<p>Mỗi lô là một task, nên người dùng vẫn cuộn trang, bấm nút bình thường trong lúc dữ liệu đang được xử lý.</p>',
      callout('note', '<code>setTimeout(fn, 0)</code> không có nghĩa là chạy sau đúng 0 ms. Đó là thời gian tối thiểu trước khi callback được xếp hàng. Khi gọi lồng nhau nhiều cấp, trình duyệt còn nâng mức tối thiểu lên khoảng 4 ms.'),
      '<p>Nắm được thứ tự này, bạn sẽ đọc ra những lỗi khó chịu như state cập nhật chậm một nhịp hay log in sai thứ tự, thay vì thêm <code>setTimeout</code> vào cho tới khi code tình cờ chạy đúng.</p>',
    ].join(''),
    comments: [
      {
        body: 'Phần microtask làm đứng trang hay quá anh. Em từng bị đúng lỗi này khi viết hàm retry bằng Promise mà không hiểu sao tab bị treo.',
        reply: 'Đúng trường hợp kinh điển luôn. Khi retry nên chờ bằng `setTimeout` (kèm backoff tăng dần) để nhường cho trình duyệt nhé.',
      },
      {
        body: 'Cho em hỏi trong Node.js thứ tự có giống trình duyệt không ạ?',
        reply: 'Phần lớn giống: đồng bộ, rồi microtask, rồi task. Node chia task thành nhiều pha (timers, I/O, check...) và có thêm `process.nextTick` chạy trước cả Promise. Mình sẽ viết riêng một bài về phần này.',
      },
      { body: 'Đọc xong em làm lại quiz chương bất đồng bộ trong khoá là đúng hết. Cảm ơn anh.' },
    ],
  },
  {
    title: '5 cách giảm kích thước image Docker mà không phải sửa code ứng dụng',
    excerpt:
      'Image to làm build chậm, đẩy lên registry lâu và tốn chỗ trên server. Năm thay đổi trong Dockerfile dưới đây thường đủ để đưa một image Node.js từ hơn 1 GB xuống còn vài trăm MB.',
    topics: ['docker', 'devops'],
    daysAgo: 19,
    likes: 38,
    cover: { kicker: 'DOCKER', headline: 'Image nhỏ hơn', sub: 'Multi-stage, .dockerignore, layer', bg: '#0B2540', accent: '#2496ED' },
    body: [
      '<p>Dockerfile đầu tiên của nhiều dự án Node.js trông như thế này:</p>',
      code('plaintext', `
FROM node:22
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["node", "dist/main.js"]`),
      '<p>Nó chạy được, nhưng image thường vượt 1 GB. Riêng image <code>node:22</code> đã chứa sẵn trình biên dịch, header hệ thống và nhiều công cụ mà ứng dụng không cần lúc chạy. Dưới đây là năm thay đổi, xếp theo mức hiệu quả.</p>',
      '<h2>1. Chọn base image nhỏ hơn</h2>',
      '<p>Bản <code>-slim</code> bỏ phần lớn công cụ build nên nhỏ hơn bản đầy đủ nhiều lần. Bản <code>-alpine</code> còn nhỏ hơn nữa, nhưng dùng thư viện C musl thay cho glibc, nên một số package có mã native như <code>bcrypt</code> hay <code>sharp</code> có thể phải build lại hoặc chạy khác đi.</p>',
      '<p>Nếu chưa chắc, hãy bắt đầu với <code>node:22-slim</code>. Đây là lựa chọn an toàn cho đa số ứng dụng.</p>',
      '<h2>2. Tách build và chạy bằng multi-stage</h2>',
      '<p>Công cụ build, TypeScript và devDependencies chỉ cần lúc build. Multi-stage build cho phép build ở một stage rồi chỉ chép kết quả sang stage chạy:</p>',
      code('plaintext', `
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/main.js"]`),
      '<p>Image cuối chỉ chứa những gì có trong stage cuối cùng. Mọi thứ ở stage <code>build</code> bị bỏ lại, kể cả mã nguồn TypeScript.</p>',
      '<p><code>USER node</code> là điểm cộng về bảo mật: tiến trình không chạy bằng root, nên nếu ứng dụng bị khai thác thì kẻ tấn công cũng bị giới hạn quyền.</p>',
      '<h2>3. Viết .dockerignore</h2>',
      '<p>Lệnh <code>COPY . .</code> chép mọi thứ trong thư mục, kể cả <code>node_modules</code> trên máy bạn và lịch sử <code>.git</code>. Thêm file <code>.dockerignore</code> cạnh Dockerfile:</p>',
      code('plaintext', `
node_modules
dist
.git
coverage
.env
*.log`),
      '<p>Dòng <code>.env</code> quan trọng hơn chuyện dung lượng: nó ngăn bạn vô tình đóng gói khoá bí mật vào image rồi đẩy lên registry.</p>',
      '<h2>4. Dọn dẹp trong cùng một lệnh RUN</h2>',
      '<p>Mỗi lệnh <code>RUN</code> tạo một layer, và layer đã tạo thì không bao giờ nhỏ đi. Xoá file ở lệnh sau chỉ che file đó đi, dung lượng vẫn nằm trong layer trước. Vì vậy cài và dọn phải nằm trong cùng một lệnh:</p>',
      code('plaintext', `
RUN apt-get update \\
  && apt-get install -y --no-install-recommends curl \\
  && rm -rf /var/lib/apt/lists/*`),
      '<p><code>--no-install-recommends</code> còn giúp tránh kéo theo hàng chục package gợi ý mà bạn không dùng.</p>',
      '<h2>5. Đo xem layer nào đang nặng</h2>',
      '<p>Đừng đoán, hãy đo. Hai lệnh sau cho biết image nặng bao nhiêu và từng lệnh trong Dockerfile đóng góp bao nhiêu:</p>',
      code('bash', `
docker image ls my-api
docker history my-api:latest`),
      '<p>Cột <code>SIZE</code> của <code>docker history</code> chỉ thẳng vào lệnh gây phình. Thủ phạm thường là một lệnh <code>COPY</code> chép thừa hoặc một lệnh cài đặt quên dọn cache.</p>',
      callout('tip', 'Đặt <code>COPY package.json package-lock.json ./</code> và <code>RUN npm ci</code> trước <code>COPY . .</code>. Khi bạn chỉ sửa code, Docker dùng lại layer cài package từ cache nên build nhanh hơn hẳn.'),
      '<p>Áp dụng đủ năm bước, image của một API Node.js thông thường giảm từ hơn 1 GB xuống còn vài trăm MB. Build nhanh hơn, deploy nhanh hơn, và bề mặt tấn công cũng nhỏ lại.</p>',
    ].join(''),
    comments: [
      {
        body: 'Áp dụng multi-stage cho project NestJS của em, image giảm từ 1,2 GB còn khoảng 300 MB. Cảm ơn anh.',
        reply: 'Tuyệt quá. Muốn giảm nữa thì xem lại `dependencies` xem có package nào chỉ dùng lúc build mà đang nằm nhầm chỗ không nhé.',
      },
      {
        body: 'Alpine có nên dùng cho production không anh?',
        reply: 'Dùng được, nhiều đội vẫn dùng. Chỉ cần test kỹ các package có mã native. Nếu nhóm không có thời gian xử lý mấy lỗi đó thì slim là lựa chọn ít rủi ro hơn.',
      },
    ],
  },
  {
    title: 'Git rebase hay merge: chọn cái nào khi làm việc nhóm',
    excerpt:
      'Merge giữ nguyên lịch sử, rebase làm lịch sử thẳng hàng. Cả hai đều đúng nếu dùng đúng chỗ. Bài này đưa ra một quy trình cụ thể cho nhánh tính năng, cùng nguyên tắc duy nhất không được phá.',
    topics: ['git', 'github'],
    daysAgo: 12,
    likes: 31,
    cover: { kicker: 'GIT', headline: 'Rebase hay merge', sub: 'Quy trình cho nhánh tính năng', bg: '#1F1512', accent: '#F05032' },
    body: [
      '<p>Nhánh tính năng của bạn tách ra từ <code>main</code> ba ngày trước. Trong lúc đó đồng đội đã gộp thêm năm commit vào <code>main</code>. Trước khi mở pull request, bạn cần đưa thay đổi mới nhất vào nhánh của mình. Có hai cách: <code>merge</code> và <code>rebase</code>.</p>',
      '<h2>Merge: giữ nguyên lịch sử</h2>',
      code('bash', `
git switch feature/checkout
git merge main`),
      '<p>Git tạo một <em>merge commit</em> nối hai nhánh lại. Không commit nào bị viết lại nên cách này luôn an toàn. Đổi lại, nếu ngày nào bạn cũng merge <code>main</code> vào nhánh thì lịch sử sẽ đầy những commit kiểu "Merge branch \'main\' into feature/checkout", rất khó đọc.</p>',
      '<h2>Rebase: viết lại cho thẳng hàng</h2>',
      code('bash', `
git switch feature/checkout
git fetch origin
git rebase origin/main`),
      '<p>Rebase nhấc từng commit của bạn ra rồi áp lại lần lượt lên đầu <code>origin/main</code>. Lịch sử trở thành một đường thẳng, như thể bạn bắt đầu làm sau khi đồng đội đã xong.</p>',
      '<p>Cái giá là các commit đó là commit <strong>mới</strong>, có mã hash khác. Nội dung giống nhau, nhưng với Git đó là những commit khác hẳn.</p>',
      '<h2>Nguyên tắc vàng</h2>',
      callout('warning', 'Không rebase những commit mà người khác đã lấy về và làm tiếp trên đó. Viết lại lịch sử chung sẽ khiến nhánh của họ lệch khỏi nhánh của bạn và rất khó gỡ.'),
      '<p>Hiểu đơn giản: nhánh tính năng chỉ mình bạn làm thì rebase thoải mái. Nhánh dùng chung như <code>main</code> hay <code>develop</code> thì không bao giờ rebase.</p>',
      '<h2>Quy trình gợi ý cho nhánh tính năng</h2>',
      ol(
        'Trong lúc làm, commit nhỏ và thường xuyên, chưa cần đẹp.',
        'Trước khi mở pull request, dọn lại các commit bằng rebase tương tác: gộp commit sửa lỗi gõ vào commit gốc, sửa message cho rõ.',
        'Rebase lên <code>origin/main</code> mới nhất và chạy lại test.',
        'Đẩy lên bằng <code>--force-with-lease</code>.',
        'Gộp pull request vào <code>main</code> bằng merge commit hoặc squash, theo quy ước của nhóm.',
      ),
      code('bash', `
git rebase -i origin/main      # đánh dấu fixup/squash cho commit cần gộp
git push --force-with-lease`),
      '<p>Sau khi rebase, nhánh trên máy và nhánh trên remote đã khác nhau nên phải đẩy đè. <code>--force-with-lease</code> chỉ đè khi nhánh remote vẫn đúng như lần cuối bạn fetch. Nếu ai đó vừa đẩy thêm commit, lệnh sẽ từ chối thay vì xoá mất việc của họ. Còn <code>--force</code> thì đè luôn, không kiểm tra gì.</p>',
      '<h2>Lỡ rebase hỏng thì sao?</h2>',
      '<p>Git hầu như không làm mất commit nào. <code>git reflog</code> liệt kê mọi vị trí mà <code>HEAD</code> từng đứng, kể cả trước khi rebase:</p>',
      code('bash', `
git reflog
# a1b2c3d HEAD@{5}: commit: Thêm bước thanh toán
git reset --hard HEAD@{5}`),
      '<p>Lưu ý <code>reset --hard</code> xoá các thay đổi chưa commit, nên hãy commit hoặc stash trước. Còn nếu đang rebase dở mà gặp xung đột và muốn quay lại từ đầu, chỉ cần <code>git rebase --abort</code>.</p>',
      callout('tip', 'Chạy <code>git config --global pull.rebase true</code> để <code>git pull</code> tự rebase thay vì tạo merge commit mỗi lần kéo code mới.'),
    ].join(''),
    comments: [
      {
        body: 'Nhóm em từng mất code vì có bạn dùng `push --force`. Từ giờ cả nhóm chuyển sang `--force-with-lease`.',
        reply: 'Bật thêm branch protection cho `main` trên GitHub để chặn force push hoàn toàn thì còn an toàn hơn nữa.',
      },
      {
        body: 'Squash merge với rebase merge khác nhau thế nào ạ?',
        reply: 'Squash gộp toàn bộ commit của pull request thành một commit trên `main`. Rebase merge giữ từng commit nhưng xếp thẳng hàng. Nhóm muốn `main` gọn thì chọn squash, muốn giữ chi tiết từng bước thì chọn rebase.',
      },
    ],
  },
  {
    title: 'Đọc EXPLAIN ANALYZE trong PostgreSQL để tìm ra câu truy vấn chậm ở đâu',
    excerpt:
      'Một câu truy vấn từ 48 ms xuống 0,1 ms chỉ nhờ một index đúng thứ tự cột. Bài này hướng dẫn đọc kế hoạch thực thi: nút nào tốn thời gian, số dòng ước lượng lệch ra sao và khi nào nên thêm index.',
    topics: ['postgresql', 'sql'],
    daysAgo: 7,
    likes: 27,
    cover: { kicker: 'POSTGRESQL', headline: 'EXPLAIN ANALYZE', sub: 'Đọc kế hoạch thực thi', bg: '#0E2233', accent: '#5FA8E8' },
    body: [
      '<p>Trang "Đơn hàng của tôi" mở chậm dần khi bảng <code>orders</code> lên tới khoảng 100.000 dòng. Câu truy vấn trông rất bình thường:</p>',
      code('sql', `
SELECT id, total
FROM orders
WHERE user_id = 42 AND status = 'paid'
ORDER BY created_at DESC
LIMIT 20;`),
      '<p>Thay vì đoán, hãy hỏi PostgreSQL xem nó đã chạy câu này như thế nào.</p>',
      '<h2>EXPLAIN và EXPLAIN ANALYZE khác nhau ở đâu</h2>',
      '<p><code>EXPLAIN</code> chỉ in ra <strong>kế hoạch dự kiến</strong>, kèm chi phí và số dòng ước lượng. <code>EXPLAIN ANALYZE</code> <strong>chạy thật</strong> câu truy vấn rồi in thêm thời gian và số dòng thực tế. Thêm <code>BUFFERS</code> để xem câu truy vấn đọc bao nhiêu trang dữ liệu:</p>',
      code('sql', `
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, total
FROM orders
WHERE user_id = 42 AND status = 'paid'
ORDER BY created_at DESC
LIMIT 20;`),
      callout('warning', 'Vì <code>ANALYZE</code> chạy thật, đừng dùng trực tiếp với <code>UPDATE</code> hay <code>DELETE</code> trên dữ liệu thật. Hãy bọc trong <code>BEGIN;</code> và <code>ROLLBACK;</code>.'),
      '<h2>Đọc kế hoạch từ trong ra ngoài</h2>',
      '<p>Kết quả dưới đây đã lược bớt phần cost cho dễ đọc:</p>',
      code('plaintext', `
Limit  (actual time=48.210..48.215 rows=20 loops=1)
  ->  Sort  (actual time=48.208..48.211 rows=20 loops=1)
        Sort Key: created_at DESC
        Sort Method: top-N heapsort  Memory: 26kB
        ->  Seq Scan on orders  (actual time=0.031..47.512 rows=2190 loops=1)
              Filter: ((user_id = 42) AND (status = 'paid'::text))
              Rows Removed by Filter: 97810
              Buffers: shared hit=640
Planning Time: 0.180 ms
Execution Time: 48.260 ms`),
      '<p>Kế hoạch là một cây. Nút thụt vào sâu nhất chạy trước và đẩy dữ liệu lên nút cha, nên ta đọc từ dưới lên:</p>',
      ul(
        '<strong>Seq Scan</strong>: PostgreSQL đọc toàn bộ bảng, giữ 2.190 dòng khớp điều kiện và bỏ 97.810 dòng. Riêng bước này mất 47,5 ms trên tổng 48,3 ms.',
        '<strong>Sort</strong>: sắp 2.190 dòng theo <code>created_at</code> để lấy 20 dòng mới nhất.',
        '<strong>Limit</strong>: cắt lấy 20 dòng.',
      ),
      '<p>Với mỗi nút, <code>actual time</code> có hai số: thời điểm trả dòng đầu tiên và thời điểm trả dòng cuối cùng, tính bằng mili giây. Nếu <code>loops</code> lớn hơn 1 thì đó là thời gian trung bình mỗi lần, hãy nhân với số lần lặp.</p>',
      '<h2>So số dòng ước lượng với số dòng thật</h2>',
      '<p>Ở kết quả đầy đủ, mỗi nút còn có <code>rows=</code> ước lượng trong phần cost. Nếu ước lượng là 50 mà thực tế là 50.000, planner đã chọn kế hoạch dựa trên thông tin sai. Nguyên nhân thường gặp là thống kê của bảng đã cũ. Chạy <code>ANALYZE orders;</code> để cập nhật rồi xem lại kế hoạch.</p>',
      '<h2>Sửa bằng index đúng thứ tự cột</h2>',
      '<p>Câu truy vấn lọc bằng hai điều kiện so sánh bằng (<code>user_id</code>, <code>status</code>) rồi sắp theo <code>created_at</code>. Index tốt nhất đặt các cột lọc bằng trước, cột sắp xếp sau:</p>',
      code('sql', `
CREATE INDEX CONCURRENTLY orders_user_status_created_idx
  ON orders (user_id, status, created_at DESC);`),
      code('plaintext', `
Limit  (actual time=0.040..0.085 rows=20 loops=1)
  ->  Index Scan using orders_user_status_created_idx on orders  (actual time=0.038..0.080 rows=20 loops=1)
        Index Cond: ((user_id = 42) AND (status = 'paid'::text))
        Buffers: shared hit=24
Planning Time: 0.210 ms
Execution Time: 0.110 ms`),
      '<p>Index đã trả dòng theo đúng thứ tự cần nên bước Sort biến mất. <code>Limit</code> dừng ngay sau 20 dòng đầu, không đọc phần còn lại. Thời gian giảm từ 48 ms xuống 0,1 ms, số trang đọc giảm từ 640 xuống 24.</p>',
      callout('tip', '<code>CONCURRENTLY</code> tạo index mà không khoá thao tác ghi vào bảng, phù hợp khi chạy trên production. Đổi lại, nó chậm hơn và không chạy được bên trong transaction.'),
      '<h2>Thứ tự khi điều tra một câu chậm</h2>',
      ol(
        'Chạy <code>EXPLAIN (ANALYZE, BUFFERS)</code> và tìm nút chiếm nhiều thời gian nhất.',
        'So <code>rows</code> ước lượng với thực tế. Lệch nhiều thì chạy <code>ANALYZE</code> trước khi làm gì khác.',
        'Thấy Seq Scan trên bảng lớn mà chỉ lấy ít dòng thì cân nhắc index theo đúng điều kiện lọc và sắp xếp.',
        'Đo lại. Index nào không làm kế hoạch tốt lên thì xoá đi, vì mỗi index đều làm chậm thao tác ghi.',
      ),
    ].join(''),
    comments: [
      { body: 'Giờ em mới hiểu `loops` nghĩa là gì. Trước giờ toàn chỉ nhìn mỗi Execution Time.' },
      {
        body: 'Index (user_id, status, created_at) có dùng được cho câu chỉ lọc theo user_id không ạ?',
        reply: 'Có. Index nhiều cột dùng tốt cho điều kiện trên cột đầu tiên, ở đây là `user_id`. Ngược lại, câu chỉ lọc theo `status` thì thường không tận dụng được index này.',
      },
    ],
  },
  {
    title: 'Flexbox hay Grid: quy tắc chọn nhanh cho bố cục web',
    excerpt:
      'Flexbox sắp xếp theo một chiều, Grid chia bố cục theo hai chiều. Ba ví dụ thường gặp: thanh điều hướng, lưới thẻ và khung trang cho thấy khi nào dùng cái nào và vì sao nên kết hợp cả hai.',
    topics: ['css', 'html'],
    daysAgo: 3,
    likes: 19,
    cover: { kicker: 'CSS', headline: 'Flexbox hay Grid', sub: 'Quy tắc chọn bố cục', bg: '#1B1838', accent: '#A78BFA' },
    body: [
      '<p>Câu hỏi "nên dùng Flexbox hay Grid" có một câu trả lời ngắn: <strong>Flexbox cho một chiều, Grid cho hai chiều</strong>. Phần còn lại của bài là những ví dụ để quy tắc này dễ áp dụng hơn.</p>',
      '<h2>Flexbox: nội dung quyết định bố cục</h2>',
      '<p>Flexbox xếp phần tử theo một hàng hoặc một cột, và kích thước từng phần tử phụ thuộc vào nội dung bên trong. Thanh điều hướng là ví dụ điển hình:</p>',
      code('xml', `
<nav class="topbar">
  <a class="logo" href="/">Aolumi</a>
  <a href="/courses">Khoá học</a>
  <a href="/blog">Blog</a>
  <a class="login" href="/login">Đăng nhập</a>
</nav>`),
      code('css', `
.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
}

.topbar .login {
  margin-left: auto; /* đẩy nút đăng nhập sang mép phải */
}`),
      '<p><code>margin-left: auto</code> trong flex container chiếm hết khoảng trống còn lại, nên nút đăng nhập luôn nằm sát mép phải dù các link phía trước dài hay ngắn.</p>',
      '<h2>Grid: bố cục quyết định nội dung</h2>',
      '<p>Grid chia không gian thành hàng và cột trước, rồi đặt phần tử vào. Lưới thẻ khoá học tự đổi số cột theo bề rộng màn hình chỉ với một dòng:</p>',
      code('css', `
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}`),
      '<p>Mỗi cột rộng tối thiểu 240px. Màn hình rộng thì có thêm cột, màn hình hẹp thì bớt cột, không cần media query.</p>',
      callout('warning', 'Làm lưới thẻ bằng <code>flex-wrap</code> kèm <code>flex: 1 1 240px</code> thì hàng cuối thường bị kéo giãn: còn hai thẻ thì mỗi thẻ rộng bằng nửa hàng. Grid giữ mọi thẻ cùng một cỡ vì cột đã được định sẵn.'),
      '<h2>Khung trang: Grid bên ngoài, Flexbox bên trong</h2>',
      code('css', `
.page {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "header header"
    "sidebar main";
  min-height: 100vh;
}

.page > header { grid-area: header; }
.page > aside  { grid-area: sidebar; }
.page > main   { grid-area: main; }

@media (max-width: 768px) {
  .page {
    grid-template-columns: 1fr;
    grid-template-areas: "header" "main";
  }
  .page > aside { display: none; }
}`),
      '<p><code>grid-template-areas</code> vẽ bố cục bằng chữ, đọc vào là hình dung được trang. Đổi bố cục cho mobile chỉ cần viết lại phần areas. Bên trong <code>header</code>, các nút vẫn xếp bằng Flexbox như ví dụ đầu bài.</p>',
      '<h2>Chọn nhanh theo từng trường hợp</h2>',
      ul(
        'Thanh điều hướng, nhóm nút, căn icon với chữ: <strong>Flexbox</strong>.',
        'Lưới thẻ, bảng giá, thư viện ảnh: <strong>Grid</strong>.',
        'Khung trang có header, sidebar, nội dung: <strong>Grid</strong>, bên trong từng vùng dùng Flexbox.',
        'Căn giữa một phần tử: cả hai đều được. Ngắn nhất là <code>display: grid; place-items: center;</code>.',
      ),
      '<p>Hai công cụ không loại trừ nhau. Một giao diện tốt thường dùng Grid cho khung lớn và Flexbox cho từng cụm nhỏ bên trong.</p>',
    ].join(''),
    comments: [
      { body: 'Phần flex-wrap làm hàng cuối bị giãn đúng là lỗi em gặp hoài. Đổi sang grid là hết.' },
      {
        body: '`auto-fill` với `auto-fit` khác nhau sao anh?',
        reply: 'Khi số thẻ ít hơn số cột vừa màn hình: `auto-fill` giữ lại các cột trống, còn `auto-fit` gộp cột trống để các thẻ giãn ra lấp đầy hàng. Lưới thẻ khoá học nên dùng `auto-fill` để thẻ không bị to bất thường.',
      },
    ],
  },
  {
    draft: true,
    title: 'Promise.all, allSettled, race hay any: chọn đúng khi gọi nhiều API cùng lúc',
    excerpt:
      'Bốn hàm gộp Promise trông giống nhau nhưng xử lý lỗi rất khác. Bài này so sánh từng hàm qua ví dụ gọi API thật: khi nào cả trang phải báo lỗi, khi nào nên hiện phần dữ liệu còn lấy được.',
    topics: ['javascript'],
    daysAgo: 0,
    relatedShowcase: true,
    likes: 0,
    cover: { kicker: 'JAVASCRIPT', headline: 'Promise', sub: 'all, allSettled, race, any', bg: '#16141F', accent: '#F7DF1E' },
    body: [
      '<p>Trang tổng quan của học viên cần ba thứ: thông tin cá nhân, danh sách khoá đang học và thông báo mới. Ba API này không phụ thuộc nhau, nên không có lý do gì để gọi lần lượt từng cái.</p>',
      '<h2>Gọi tuần tự là chậm mà không biết</h2>',
      code('javascript', `
const user = await getJson('/api/me');
const courses = await getJson('/api/me/courses');
const notifications = await getJson('/api/notifications');`),
      '<p>Mỗi <code>await</code> chờ request trước xong mới bắt đầu request sau. Ba API, mỗi cái 300 ms, là 900 ms. Muốn chạy song song, hãy tạo cả ba Promise trước rồi mới chờ, và đó là lúc cần đến các hàm gộp.</p>',
      '<p>Các ví dụ dưới đây dùng hàm <code>getJson</code> sau. Lý do là <code>fetch</code> không báo lỗi khi server trả 404 hay 500, nên phải tự kiểm tra:</p>',
      code('javascript', `
function getJson(url, options) {
  return fetch(url, options).then((res) => {
    if (!res.ok) throw new Error(\`\${url} trả về \${res.status}\`);
    return res.json();
  });
}`),
      '<h2>Promise.all: cần đủ tất cả</h2>',
      code('javascript', `
const [user, courses, notifications] = await Promise.all([
  getJson('/api/me'),
  getJson('/api/me/courses'),
  getJson('/api/notifications'),
]);`),
      '<p>Kết quả trả về đúng thứ tự trong mảng, không phụ thuộc API nào xong trước. Tổng thời gian bằng API chậm nhất, khoảng 300 ms thay vì 900 ms.</p>',
      '<p>Điểm cần nhớ: chỉ cần <strong>một</strong> Promise lỗi là <code>Promise.all</code> lỗi ngay, và kết quả của những cái thành công bị bỏ đi. Dùng khi thiếu một phần thì cả màn hình cũng vô nghĩa, ví dụ trang thanh toán cần cả giỏ hàng lẫn giá.</p>',
      '<h2>Promise.allSettled: lấy được gì hiện nấy</h2>',
      '<p>Thông báo lỗi không nên làm trắng cả trang tổng quan. <code>allSettled</code> luôn chờ đủ tất cả và không bao giờ báo lỗi, mỗi kết quả cho biết thành công hay thất bại:</p>',
      code('javascript', `
const results = await Promise.allSettled([
  getJson('/api/me/courses'),
  getJson('/api/notifications'),
]);
const [courses, notifications] = results.map((r) =>
  r.status === 'fulfilled' ? r.value : null,
);
// notifications === null → ẩn khối thông báo, phần còn lại vẫn hiện`),
      callout('tip', 'Phần nào lỗi thì hiện trạng thái lỗi riêng cho phần đó kèm nút thử lại, thay vì để trống. Người dùng cần biết dữ liệu không tải được chứ không phải là không có.'),
      '<h2>Promise.race: ai xong trước thì lấy</h2>',
      '<p><code>race</code> trả về kết quả của Promise <strong>xong đầu tiên</strong>, dù thành công hay lỗi. Cách dùng phổ biến nhất là đặt giới hạn thời gian:</p>',
      code('javascript', `
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(\`Quá \${ms} ms\`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}`),
      callout('warning', '<code>race</code> không huỷ Promise bị bỏ lại: request vẫn chạy tiếp ở nền. Với <code>fetch</code>, hãy dùng <code>fetch(url, { signal: AbortSignal.timeout(3000) })</code> để request thật sự dừng lại.'),
      '<h2>Promise.any: chỉ cần một cái thành công</h2>',
      '<p><code>any</code> bỏ qua các lỗi và trả về Promise <strong>thành công đầu tiên</strong>. Nó chỉ báo lỗi khi tất cả đều lỗi, lúc đó lỗi là một <code>AggregateError</code> chứa danh sách lỗi của từng cái:</p>',
      code('javascript', `
try {
  const data = await Promise.any([
    getJson('https://mirror-1.example.com/data.json'),
    getJson('https://mirror-2.example.com/data.json'),
  ]);
} catch (err) {
  console.error(err.errors); // lỗi của từng nguồn
}`),
      '<h2>Tóm tắt</h2>',
      ul(
        '<strong>Thiếu một phần là vô nghĩa</strong>: <code>Promise.all</code>.',
        '<strong>Hiện được phần nào hay phần đó</strong>: <code>Promise.allSettled</code>.',
        '<strong>Giới hạn thời gian chờ</strong>: <code>Promise.race</code>, hoặc <code>AbortSignal.timeout</code> nếu là <code>fetch</code>.',
        '<strong>Nhiều nguồn dự phòng, lấy nguồn nhanh nhất</strong>: <code>Promise.any</code>.',
      ),
      '<p>Cả bốn hàm đều chạy song song những Promise đã được tạo. Hàm gộp chỉ quyết định khi nào thì xong và xử lý lỗi ra sao.</p>',
    ].join(''),
    comments: [],
  },
];
