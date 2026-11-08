import type { SkillSeedQuestion } from '../types.ts';

// 13 easy · 14 medium · 13 hard; 10 câu multiple_choice.
// Đáp án đã được reviewer rà theo MDN / WHATWG (2026-11-04). Vị trí đúng và độ dài đáp án rải có chủ ý (validateBank strict kiểm).
export const HTML: SkillSeedQuestion[] = [
  // ───── easy (13) ─────
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Đoạn markup nào làm cho việc bấm vào chữ "Email" sẽ đưa con trỏ vào ô nhập?',
    options: [
      { content: '`<label name="email">Email</label><input id="email">`' },
      { content: '`<label for="email">Email</label><input name="email">`' },
      { content: '`<label for="email">Email</label><input id="email">`', correct: true },
      { content: '`<label id="email">Email</label><input for="email">`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Một bài viết có tiêu đề chính và hai mục con. Cách chọn thẻ heading nào đúng?',
    options: [
      { content: 'Chọn cấp heading theo phân cấp nội dung, chỉnh cỡ chữ bằng CSS', correct: true },
      { content: 'Chọn cấp heading theo cỡ chữ muốn có, vì mỗi cấp quy định sẵn một cỡ chữ' },
      { content: 'Dùng `<h1>` cho mọi tiêu đề để công cụ tìm kiếm nhận ra các phần quan trọng' },
      { content: 'Mỗi `<section>` bắt đầu lại bằng `<h1>`, vì thuật toán outline tự hạ cấp heading' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Logo của website là một ảnh nằm trong liên kết về trang chủ: `<a href="/"><img src="logo.png" alt="..."></a>`. Giá trị `alt` nào phù hợp nhất?',
    options: [
      { content: '`alt="logo.png"`' },
      { content: '`alt="Hình ảnh logo hình tròn màu xanh"`' },
      { content: '`alt=""`' },
      { content: '`alt="SkillPath - về trang chủ"`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Những tình huống nào nên dùng `<button>` thay vì `<a href>`?',
    options: [
      { content: 'Bấm để mở / đóng một menu thả xuống, không đổi URL', correct: true },
      { content: 'Bấm để chuyển tới trang `/pricing`' },
      { content: 'Bấm để gửi một form đăng ký', correct: true },
      { content: 'Bấm để tải về một tệp PDF có sẵn địa chỉ' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Đoạn markup nào lồng đúng danh sách con "HTML" vào mục "Frontend"?',
    options: [
      { content: '`<ul><li>Frontend</li><ul><li>HTML</li></ul></ul>`' },
      { content: '`<ul><li>Frontend<ul><li>HTML</li></ul></li></ul>`', correct: true },
      { content: '`<ul><li>Frontend<li>HTML</li></li></ul>`' },
      { content: '`<ul><li>Frontend</li><li><ul>HTML</ul></li></ul>`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Form đăng nhập hiển thị bình thường nhưng server không nhận được mật khẩu: `<input type="password" id="pw">`. Nguyên nhân khả dĩ nhất?',
    options: [
      { content: 'Ô nhập thiếu `placeholder`, nên trình duyệt coi giá trị là rỗng' },
      { content: 'Ô nhập `type="password"` bị trình duyệt loại khỏi dữ liệu form khi gửi' },
      { content: 'Ô nhập thiếu `<label>` đi kèm, nên trình duyệt bỏ qua khi gửi form' },
      { content: 'Ô nhập thiếu `name`, nên giá trị không được đưa vào dữ liệu form', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Trang có menu điều hướng chính, nội dung chính và chân trang. Những cặp thẻ - vai trò nào đúng?',
    options: [
      { content: '`<aside>` cho khối chân trang chứa bản quyền' },
      { content: '`<nav>` cho khối menu điều hướng chính', correct: true },
      { content: '`<main>` cho phần nội dung chính riêng của trang', correct: true },
      { content: '`<header>` chỉ được dùng đúng một lần trong cả tài liệu' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Những phần tử nào nhận focus bằng phím Tab mặc định, không cần thêm `tabindex`?',
    options: [
      { content: '`<button>`', correct: true },
      { content: '`<div onclick="...">`' },
      { content: '`<a>` không có thuộc tính `href`' },
      { content: '`<a href="/docs">`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Người dùng phải chọn đúng một trong ba gói cước. Cách dựng nào đúng?',
    options: [
      { content: 'Ba `<input type="checkbox">` có cùng `name`' },
      { content: 'Ba `<input type="radio">` mỗi cái một `name` riêng' },
      { content: 'Ba `<input type="radio">` có cùng `name`', correct: true },
      { content: 'Một `<select multiple>` có ba `<option>`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Trang `https://site.com/blog/post.html` có `<img src="images/a.png">`. Ảnh được tải từ địa chỉ nào?',
    options: [
      { content: '`https://site.com/images/a.png`' },
      { content: '`https://site.com/blog/images/a.png`', correct: true },
      { content: '`https://site.com/blog/post.html/images/a.png`' },
      { content: '`https://site.com/blog/post/images/a.png`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Trong một `<form>` có nút `<button>Huỷ</button>` (không khai báo `type`) dùng để đóng hộp thoại bằng JavaScript. Ngoài việc chạy handler, bấm nút đó còn gây ra điều gì?',
    options: [
      { content: 'Form bị gửi đi, vì `type` mặc định của `<button>` là `submit`', correct: true },
      { content: 'Form được đặt lại (reset), vì `type` mặc định của `<button>` là `reset`' },
      { content: 'Không có gì thêm, vì nút không có `name` nên không kích hoạt form' },
      { content: 'Form chỉ được kiểm tra dữ liệu nhưng không gửi, vì nút chưa có `value`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Trang có `<a href="#faq">Câu hỏi thường gặp</a>` và `<h2 id="faq">...</h2>` ở phía dưới. Bấm vào liên kết thì xảy ra điều gì?',
    options: [
      { content: 'Điều hướng tới trang `/faq` trên cùng website' },
      { content: 'Cuộn tới phần tử có `id="faq"` mà không tải lại trang', correct: true },
      { content: 'Cuộn tới phần tử đầu tiên có `class="faq"` trong trang' },
      { content: 'Tải lại trang hiện tại rồi cuộn lên đầu trang' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Muốn hiển thị đúng chữ `<div>` như văn bản bình thường trên trang (không để trình duyệt hiểu là thẻ), nên viết thế nào?',
    options: [
      { content: '`\\<div\\>`' },
      { content: '`<!-- div -->`' },
      { content: '`&lt;div&gt;`', correct: true },
      { content: '`"<div>"` (đặt trong dấu nháy kép)' },
    ],
  },

  // ───── medium (14) ─────
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Người dùng bấm nút "Tìm". Địa chỉ được yêu cầu (GET) có query string nào?

\`\`\`html
<form action="/search">
  <input name="q" value="html">
  <input name="lang" value="vi" disabled>
  <input name="page" value="2" readonly>
  <button>Tìm</button>
</form>
\`\`\``,
    options: [
      { content: '`/search?q=html&lang=vi&page=2`' },
      { content: '`/search?q=html&page=2`', correct: true },
      { content: '`/search?q=html&lang=vi`' },
      { content: '`/search?q=html`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Bấm vào chữ "Tên" thì trình duyệt đưa focus vào ô nào, và ô nào được gắn nhãn "Tên"?

\`\`\`html
<label>Tên
  <input id="first">
  <input id="last">
</label>
\`\`\``,
    options: [
      { content: 'Ô `first`: đó là phần tử labelable đầu tiên bên trong `<label>`', correct: true },
      { content: 'Ô `last`: phần tử labelable sau cùng thắng khi có nhiều ô' },
      { content: 'Cả hai ô được gắn nhãn "Tên", vì một `<label>` gắn được nhiều control' },
      { content: 'Không ô nào, vì `<label>` thiếu thuộc tính `for`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `\`a.js\` nặng và tải chậm hơn \`b.js\`. Thứ tự thực thi hai script là gì?

\`\`\`html
<script src="a.js" defer></script>
<script src="b.js" defer></script>
\`\`\``,
    options: [
      { content: '`b.js` rồi `a.js`, vì `b.js` tải xong sớm hơn' },
      { content: 'Thứ tự không cố định, mỗi script chạy ngay khi tải xong' },
      { content: 'Cả hai chạy ngay khi gặp thẻ và chặn việc phân tích HTML' },
      { content: '`a.js` rồi `b.js`, sau khi tài liệu phân tích xong', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: 'Trình duyệt kiểm tra ràng buộc HTML5 khi gửi form. Những ô nào dưới đây làm form bị chặn gửi (ở trạng thái như viết sẵn)?',
    options: [
      { content: '`<input type="number" min="1" max="5" value="3">`' },
      { content: '`<input type="email" value="abc">`', correct: true },
      { content: '`<input type="text" required value="x">`' },
      { content: '`<input required value="">`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Video dưới đây không tự phát khi vừa mở trang trên Chrome và Safari. Chỉnh sửa nào hợp lý nhất để autoplay hoạt động?

\`\`\`html
<video src="intro.mp4" autoplay></video>
\`\`\``,
    options: [
      { content: 'Thêm `controls`, vì bấm vào điều khiển được tính là tương tác của người dùng' },
      { content: 'Thêm `preload="auto"`, để video được tải sẵn trước khi tới lượt phát' },
      { content: 'Thêm `muted` (kèm `playsinline` trên iOS), để đáp ứng chính sách autoplay', correct: true },
      { content: 'Thêm `loop`, để trình duyệt thử phát lại sau lần bị chặn đầu tiên' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: 'Một ảnh hero nằm ngay đầu trang (trong khung nhìn khi vừa tải) được gắn `loading="lazy"`. Hệ quả đáng lo nhất là gì?',
    options: [
      { content: 'Sự kiện `load` của window bị hoãn tới khi ảnh này tải xong' },
      { content: 'Ảnh không được tải cho tới khi người dùng cuộn, dù đang trong khung nhìn' },
      { content: 'Trình duyệt bỏ qua `lazy` với ảnh trong khung nhìn nên không ảnh hưởng gì' },
      { content: 'Ảnh bị trì hoãn tới khi layout xác định vị trí, làm LCP chậm hơn', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: 'Những phát biểu nào đúng về thuộc tính `alt` của ảnh?',
    options: [
      { content: 'Ảnh chỉ để trang trí nên dùng `alt=""` để trình đọc màn hình bỏ qua', correct: true },
      { content: 'Nên mở đầu `alt` bằng "Hình ảnh của..." để người dùng biết đó là một ảnh' },
      { content: 'Bỏ hẳn thuộc tính `alt` cũng tương đương với việc đặt `alt=""`' },
      { content: 'Ảnh chứa chữ (như banner) thì `alt` nên chép lại đúng nội dung chữ đó', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Radio nào đang được chọn sau khi trang tải xong?

\`\`\`html
<input type="radio" name="size" value="s">
<input type="radio" name="size" value="m" checked>
<input type="radio" name="size" value="l" checked>
\`\`\``,
    options: [
      { content: '`m`, vì nó có `checked` đầu tiên' },
      { content: '`l`, vì radio đặt sau cùng thắng trong nhóm', correct: true },
      { content: 'Cả `m` và `l`, vì mỗi radio đều có `checked`' },
      { content: 'Không radio nào, vì hai `checked` mâu thuẫn nhau' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Người dùng chọn "Lào" rồi gửi form. Giá trị của \`c\` trong dữ liệu gửi đi là gì?

\`\`\`html
<select name="c">
  <option value="vn">Việt Nam</option>
  <option>Lào</option>
</select>
\`\`\``,
    options: [
      { content: '`c=Lào` (đã mã hoá URL), lấy từ nội dung văn bản', correct: true },
      { content: '`c=` (rỗng), vì `<option>` này thiếu `value`' },
      { content: '`c=2`, theo thứ tự của `<option>`' },
      { content: 'Không gửi `c`, vì `<option>` thiếu `value`' },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: `Ba mục FAQ dùng chung \`name\` như dưới đây, ban đầu đều đóng. Những phát biểu nào đúng?

\`\`\`html
<details name="faq"><summary>A</summary>...</details>
<details name="faq"><summary>B</summary>...</details>
<details name="faq"><summary>C</summary>...</details>
\`\`\``,
    options: [
      { content: 'Mở mục B không ảnh hưởng mục A, vì `name` chỉ để định danh cho JavaScript' },
      { content: 'Mở mục B khi mục A đang mở thì mục A tự đóng lại, không cần JavaScript', correct: true },
      { content: 'Các `<details>` khác `name` thuộc nhóm riêng, mỗi nhóm có tối đa một mục mở', correct: true },
      { content: 'Thêm `open` cho cả ba mục trong markup thì cả ba cùng mở khi tải trang' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Ô "D" nằm ở cột thứ mấy của bảng (tính từ 1)?

\`\`\`html
<table>
  <tr><td rowspan="2">A</td><td>B</td><td>C</td></tr>
  <tr><td>D</td><td>E</td></tr>
</table>
\`\`\``,
    options: [
      { content: 'Cột 1, vì `D` là ô đầu tiên của hàng thứ hai' },
      { content: 'Cột 3, vì `D` nằm sau `A` và `B`' },
      { content: 'Cột 2, vì cột 1 đã bị ô `A` từ hàng trên chiếm chỗ', correct: true },
      { content: 'Không xác định, vì hàng hai ít thẻ `<td>` hơn hàng một' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: 'Gán `input.value = "25/12/2026"` cho một `<input type="date">`. Kết quả là gì?',
    options: [
      { content: 'Giá trị sai định dạng `YYYY-MM-DD` nên `value` thành chuỗi rỗng', correct: true },
      { content: 'Ô hiển thị 25/12/2026 và `value` giữ nguyên chuỗi đó' },
      { content: 'Trình duyệt tự phân tích rồi đổi `value` thành `2026-12-25`' },
      { content: 'Ném `TypeError` ngay tại dòng gán giá trị' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: 'Một câu tiếng Việt có chèn từ tiếng Anh `responsive`; trình đọc màn hình đọc từ đó bằng giọng tiếng Việt nên nghe sai. Cách khắc phục đúng chuẩn là gì?',
    options: [
      { content: 'Thêm `aria-label="responsive"` vào thẻ bao quanh từ đó' },
      { content: 'Bọc từ đó trong `<span translate="no">`' },
      { content: 'Bọc từ đó trong `<span dir="ltr">`' },
      { content: 'Bọc từ đó trong `<span lang="en">`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn mã dưới đây gây ra điều gì?

\`\`\`html
<script>
  document.getElementById('x').textContent = 'Hi';
</script>
<p id="x">Chào</p>
\`\`\``,
    options: [
      { content: 'Đoạn `<p>` hiển thị "Hi"' },
      { content: 'Đoạn `<p>` hiển thị "Chào", không có lỗi' },
      { content: 'Lỗi `TypeError`, vì `getElementById` trả về `null`', correct: true },
      { content: 'Script tự chờ tới khi `<p>` được phân tích rồi chạy' },
    ],
  },

  // ───── hard (13) ─────
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Người dùng nhấn Enter khi con trỏ đang ở ô \`q\`. Điều gì xảy ra?

\`\`\`html
<form>
  <input name="q">
  <button type="button" id="a">A</button>
  <button id="b">B</button>
  <button type="reset" id="c">C</button>
</form>
\`\`\``,
    options: [
      { content: 'Phát `click` vào nút B (nút submit mặc định), nên form được gửi', correct: true },
      { content: 'Phát `click` vào nút A (nút đầu tiên trong form), nên không gửi gì' },
      { content: 'Không phát `click`, form được gửi trực tiếp bởi trình duyệt' },
      { content: 'Không có gì xảy ra, vì form có nhiều hơn một nút' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Tên truy cập được (accessible name) mà trình đọc màn hình đọc cho ô nhập này là gì?

\`\`\`html
<label for="n">Họ tên</label>
<input id="n" aria-label="Tên đăng nhập" placeholder="Nguyễn Văn A">
\`\`\``,
    options: [
      { content: '"Họ tên", vì `<label>` gốc được ưu tiên hơn ARIA' },
      { content: '"Tên đăng nhập", vì `aria-label` được ưu tiên hơn `<label>`', correct: true },
      { content: '"Nguyễn Văn A", vì `placeholder` hiển thị ngay trong ô' },
      { content: '"Họ tên Tên đăng nhập", vì cả hai nguồn được ghép lại' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Viewport rộng 400 CSS px, màn hình có devicePixelRatio = 2. Giả sử trình duyệt chọn ứng viên nhỏ nhất có mật độ hiệu dụng ≥ DPR. Ảnh nào được chọn?

\`\`\`html
<img src="a-400.jpg" sizes="100vw"
     srcset="a-400.jpg 400w, a-800.jpg 800w, a-1600.jpg 1600w">
\`\`\``,
    options: [
      { content: '`a-400.jpg`, vì `src` trùng ứng viên 400w nên được ưu tiên' },
      { content: '`a-1600.jpg`, vì chia cho độ rộng vật lý 800px thì 1600w là 2x' },
      { content: '`a-800.jpg`, vì 800w chia cho độ rộng slot 400px được 2x', correct: true },
      { content: 'Không ảnh nào, vì `sizes="100vw"` không dùng được cùng bộ mô tả `w`' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Với đoạn HTML dưới đây (\`m.js\` là module), những phát biểu nào đúng?

\`\`\`html
<script src="a.js" async></script>
<script type="module" src="m.js"></script>
<script src="d.js" defer></script>
<script>console.log('inline')</script>
\`\`\``,
    options: [
      { content: '`inline` chạy trước `m.js` và `d.js`', correct: true },
      { content: '`d.js` chạy trước `m.js` vì `defer` có ưu tiên cao hơn module' },
      { content: '`m.js` chạy trước `d.js`, vì module mặc định hoãn và theo thứ tự trong tài liệu như `defer`', correct: true },
      { content: '`a.js` chắc chắn chạy xong trước `m.js` vì nó đứng trước trong tài liệu' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Dòng \`console.log\` trong script cuối in ra gì, và trình duyệt có tải \`a.png\` vào lúc đó không?

\`\`\`html
<template id="t"><img src="a.png"></template>
<script>
  console.log(document.querySelectorAll('img').length);
</script>
\`\`\``,
    options: [
      { content: '`1`, và tải `a.png` ngay vì ảnh nằm trong tài liệu' },
      { content: '`1`, nhưng chưa tải `a.png` vì ảnh đang bị ẩn' },
      { content: '`0`, nhưng vẫn tải ngầm `a.png` để sẵn sàng khi nhân bản' },
      { content: '`0`, và chưa tải `a.png` cho tới khi nội dung được chèn vào tài liệu', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: 'Những phát biểu nào đúng về `<dialog>`?',
    options: [
      { content: 'Dialog mở bằng thuộc tính `open` vẫn là modal, vì được đặt ở top layer và chặn tương tác bên ngoài' },
      { content: 'Gọi `showModal()` làm phần còn lại của trang không tương tác được (inert), Esc kích hoạt đóng', correct: true },
      { content: '`show()` chặn tương tác bên ngoài giống `showModal()`, chỉ khác là không có lớp `::backdrop`' },
      { content: '`<form method="dialog">` đóng dialog mà không gửi request; `returnValue` lấy `value` của nút submit', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: 'Trang `https://site.com/` có `<a href="https://cdn.other.com/report.pdf" download="bao-cao.pdf">`, server CDN không gửi header `Content-Disposition`. Trình duyệt hiện đại xử lý thuộc tính `download` thế nào?',
    options: [
      { content: 'Tải tệp xuống với tên `bao-cao.pdf`, vì `download` đã đặt tên rõ ràng' },
      { content: 'Bỏ qua `download` vì khác origin, xử lý như liên kết thường', correct: true },
      { content: 'Chặn liên kết và báo lỗi CORS trong console' },
      { content: 'Tải tệp xuống nhưng giữ tên gốc `report.pdf` của server' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: 'Những phát biểu nào đúng về kiểm tra ràng buộc (constraint validation) của form?',
    options: [
      { content: 'Form có `novalidate` vẫn gửi được khi có ô sai, nhưng `form.checkValidity()` vẫn trả `false`', correct: true },
      { content: 'Ô `<input required disabled>` để trống vẫn chặn việc gửi form' },
      { content: 'Sau `input.setCustomValidity("Lỗi")`, ô tự hợp lệ lại ngay khi người dùng sửa nội dung' },
      { content: 'Nút có `formnovalidate` bỏ qua validation cho riêng lần gửi do nút đó kích hoạt', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Phần tử dưới đây hiển thị hay bị ẩn, và vì sao?

\`\`\`html
<style>.card { display: flex; }</style>
<div class="card" hidden>Nội dung</div>
\`\`\``,
    options: [
      { content: 'Hiện, vì `display: flex` ghi đè `display: none` của `hidden`', correct: true },
      { content: 'Ẩn, vì `hidden` là thuộc tính HTML nên được ưu tiên hơn CSS' },
      { content: 'Ẩn, vì `display: flex` không áp dụng cho phần tử có `hidden`' },
      { content: 'Hiện, vì `hidden` chỉ có tác dụng khi viết `hidden="true"`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Trình duyệt hỗ trợ AVIF, viewport rộng 1000px. Ảnh nào được dùng?

\`\`\`html
<picture>
  <source srcset="a.avif" type="image/avif">
  <source srcset="b-wide.jpg" media="(min-width: 800px)">
  <img src="c.jpg" alt="">
</picture>
\`\`\``,
    options: [
      { content: '`b-wide.jpg`, vì `media` cụ thể hơn `type`' },
      { content: '`c.jpg`, vì `<img>` là nguồn chính, `<source>` chỉ để dự phòng' },
      { content: 'Cả `a.avif` và `b-wide.jpg`, rồi chọn ảnh nhỏ hơn' },
      { content: '`a.avif`, vì `<source>` đầu tiên khớp điều kiện được dùng', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: 'Một trang tiếng Việt lưu UTF-8 (không BOM), server không gửi charset trong header HTTP. Dev đặt `<meta charset="utf-8">` sau một khối `<style>` inline dài ~3KB trong `<head>`. Nhận định nào đúng?',
    options: [
      { content: 'Thẻ `<meta charset>` phải là con đầu tiên của `<head>`, đứng sau `<style>` nên bị bỏ qua' },
      { content: 'HTML5 lấy UTF-8 làm mặc định khi chưa thấy khai báo, nên trang vẫn hiển thị đúng dấu' },
      { content: 'Khai báo phải nằm trọn trong 1024 byte đầu; ở đây nằm ngoài nên có thể bị dò muộn, vỡ dấu', correct: true },
      { content: 'Mã hoá áp từ chỗ đặt thẻ trở đi, nên `<style>` phía trên có thể vỡ dấu, phần sau thì đúng' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Trình duyệt phân tích đoạn HTML sau. Có bao nhiêu \`<p>\` trong DOM, và chữ "C" nằm ở đâu?

\`\`\`html
<p>A<div>B</div>C</p>
\`\`\``,
    options: [
      { content: '2 `<p>`; "C" nằm trực tiếp trong `<body>`, `<p>` thứ hai rỗng', correct: true },
      { content: '1 `<p>`; `</p>` thừa bị bỏ qua, "C" nằm trực tiếp trong `<body>`' },
      { content: '1 `<p>`; "C" nằm trong `<p>` đó, sau thẻ `<div>`' },
      { content: '2 `<p>`; "C" nằm trong `<p>` thứ hai' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Hai nút submit cùng \`name\` trong một form, ô \`title\` đã được điền. Những phát biểu nào đúng?

\`\`\`html
<form id="f" action="/x">
  <input name="title" value="Bài 1" required>
  <button name="action" value="save">Lưu</button>
  <button name="action" value="draft">Nháp</button>
</form>
\`\`\``,
    options: [
      { content: 'Bấm "Nháp" gửi cả `action=save` và `action=draft` vì hai nút cùng `name`' },
      { content: '`f.requestSubmit(nútNháp)` gửi `action=draft` và vẫn chạy kiểm tra validation', correct: true },
      { content: '`f.submit()` không gửi cặp `action` nào và bỏ qua kiểm tra validation', correct: true },
      { content: '`f.submit()` gửi kèm `action=save` vì đó là nút submit đầu tiên' },
    ],
  },
];
