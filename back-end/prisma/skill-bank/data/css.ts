import type { SkillSeedQuestion } from '../types.ts';

// 13 easy · 14 medium · 13 hard; 10 câu multiple_choice.
// Đáp án đối chiếu MDN / CSSWG (selectors-4, css-variables-1, css-cascade-5, css-grid-1, css-flexbox-1) ngày 2026-11-04.
// Vị trí đúng và độ dài đáp án rải có chủ ý (validateBank strict kiểm).
export const CSS: SkillSeedQuestion[] = [
  // ───── easy (13) ─────
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Chữ "Hello" hiển thị màu gì, và vì sao?

\`\`\`html
<style>
  .a { color: red; }
  .b { color: blue; }
</style>
<p class="b a">Hello</p>
\`\`\``,
    options: [
      { content: 'Đỏ, vì `a` đứng sau `b` trong thuộc tính `class`' },
      { content: 'Xanh, vì rule `.b` đứng sau rule `.a` trong stylesheet', correct: true },
      { content: 'Xanh, vì `b` được viết đầu tiên trong thuộc tính `class`' },
      { content: 'Đỏ, vì rule `.a` khai báo trước nên được ưu tiên hơn' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Liên kết "Trang chủ" có màu gì, và vì sao?

\`\`\`html
<style>
  #nav a { color: blue; }
  .menu a.active { color: red; }
</style>
<nav id="nav" class="menu">
  <a class="active" href="/">Trang chủ</a>
</nav>
\`\`\``,
    options: [
      { content: 'Đỏ, vì rule đứng sau thắng khi hai rule cùng áp vào một phần tử' },
      { content: 'Xanh, vì `#nav` là tổ tiên gần hơn `.menu` nên được ưu tiên' },
      { content: 'Xanh, vì `#nav a` có specificity (1,0,1), lớn hơn (0,2,1)', correct: true },
      { content: 'Đỏ, vì `.menu a.active` có hai class, nhiều hơn một ID' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Những khai báo nào làm hộp có tổng chiều rộng (tính cả padding và border, chưa tính margin) đúng 300px?',
    options: [
      { content: '`width: 300px; padding: 20px; box-sizing: border-box;`', correct: true },
      { content: '`width: 300px; padding: 20px;`' },
      { content: '`width: 260px; padding: 20px;`', correct: true },
      { content: '`width: 240px; padding: 20px; border: 10px solid; box-sizing: border-box;`' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: `Không có CSS nào khác ngoài đoạn dưới đây. Những phát biểu nào đúng về thẻ \`<p>\`?

\`\`\`html
<style>
  .box { color: crimson; font-family: serif; border: 1px solid; padding: 20px; }
</style>
<div class="box"><p>Xin chào</p></div>
\`\`\``,
    options: [
      { content: '`<p>` có viền 1px riêng, nằm bên trong viền của `.box`' },
      { content: 'Chữ trong `<p>` có màu crimson, kế thừa từ `.box`', correct: true },
      { content: '`<p>` có padding 20px riêng, cộng dồn với padding của `.box`' },
      { content: 'Chữ trong `<p>` dùng font serif, kế thừa từ `.box`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `\`.box\` có padding và margin bằng bao nhiêu px?

\`\`\`css
html { font-size: 16px; }
.box { font-size: 20px; padding: 2em; margin: 2rem; }
\`\`\``,
    options: [
      { content: 'padding 40px, margin 32px', correct: true },
      { content: 'padding 32px, margin 32px' },
      { content: 'padding 40px, margin 40px' },
      { content: 'padding 32px, margin 40px' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `\`.parent\` không đặt \`position\`. Badge "3" nằm ở đâu?

\`\`\`html
<div class="grand" style="position: relative;">
  <div class="parent">
    <span class="badge" style="position: absolute; top: 0; right: 0;">3</span>
  </div>
</div>
\`\`\``,
    options: [
      { content: 'Góc trên-phải của `.parent`, vì đó là cha trực tiếp của badge' },
      { content: 'Góc trên-phải của `.grand`, tổ tiên gần nhất có `position` khác `static`', correct: true },
      { content: 'Góc trên-phải của viewport, vì `absolute` tính theo cửa sổ trình duyệt' },
      { content: 'Góc trên-phải của `<body>`, vì `.parent` không được định vị' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Ba nút A, B, C lần lượt có `visibility: hidden`, `display: none` và `opacity: 0`. Những phát biểu nào đúng?',
    options: [
      { content: 'Nút C không nhận được click, vì đã trong suốt hoàn toàn' },
      { content: 'Nút A vẫn chiếm chỗ trong layout dù không nhìn thấy', correct: true },
      { content: 'Nút B không chiếm chỗ, các phần tử phía sau dồn lên', correct: true },
      { content: 'Con của A đặt `visibility: visible` vẫn bị ẩn theo A' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Chấm đỏ trước chữ "Email" không hiện. Nguyên nhân là gì?

\`\`\`html
<style>
  .required::before {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: red;
  }
</style>
<label class="required">Email</label>
\`\`\``,
    options: [
      { content: 'Phải viết `:before` với một dấu hai chấm thì trình duyệt mới nhận' },
      { content: '`::before` không nhận `width` và `height` dù là `inline-block`' },
      { content: 'Pseudo-element cần `position: absolute` thì mới được hiển thị' },
      { content: 'Thiếu `content` (như `content: ""`) nên box không được tạo ra', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Container `.stack { display: flex; flex-direction: column; }`. Muốn các item con nằm giữa theo chiều ngang (không bị kéo giãn hết bề ngang), cần thêm gì cho `.stack`?',
    options: [
      { content: '`justify-content: center`, vì `justify-content` căn theo chiều ngang' },
      { content: '`text-align: center`, vì flex item kế thừa cách căn của container' },
      { content: '`align-items: center`, vì trục phụ (cross axis) lúc này là chiều ngang', correct: true },
      { content: '`align-content: center`, vì thuộc tính này căn từng item theo trục phụ' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Mỗi cột rộng bao nhiêu?

\`\`\`css
.grid {
  display: grid;
  width: 640px;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
\`\`\``,
    options: [
      { content: '200px: lấy 640px trừ 2 khoảng gap rồi chia 3', correct: true },
      { content: '213.33px: chia đều 640px cho 3, gap không trừ vào' },
      { content: '193.33px: lấy 640px trừ 3 khoảng gap rồi chia 3' },
      { content: '186.67px: lấy 640px trừ 4 khoảng gap (cả hai mép) rồi chia 3' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Chữ trên hai nút có màu gì?

\`\`\`html
<style>
  :root { --brand: blue; }
  .promo { --brand: red; }
  .btn { color: var(--brand); }
</style>
<section class="promo"><button class="btn">Mua</button></section>
<button class="btn">Xem</button>
\`\`\``,
    options: [
      { content: 'Cả hai màu xanh, vì `--brand` ở `:root` là biến toàn cục' },
      { content: 'Cả hai màu đỏ, vì `.promo` khai báo sau nên ghi đè `--brand` toàn trang' },
      { content: 'Cả hai màu đen mặc định, vì `--brand` bị khai báo hai lần nên xung đột' },
      { content: '"Mua" đỏ, "Xem" xanh, vì biến CSS kế thừa theo cây DOM', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Trang có `@media (max-width: 600px) { ... }`. Thu nhỏ cửa sổ trên máy tính thì media query chạy đúng, nhưng mở trên điện thoại rộng 390px thì trang hiện như bản desktop thu nhỏ và rule trong media query không áp dụng. Nguyên nhân khả dĩ nhất?',
    options: [
      { content: 'Media query thiếu `screen and` nên không áp dụng cho thiết bị di động' },
      { content: 'Thiếu thẻ `<meta name="viewport" content="width=device-width">`', correct: true },
      { content: 'Điện thoại có devicePixelRatio 3 nên thực tế rộng 1170px' },
      { content: 'Rule trong media query cần `!important` để thắng rule desktop' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Một khối nằm giữa hai đoạn văn được đặt `position: relative; top: 20px;`. Kết quả là gì?',
    options: [
      { content: 'Khối dịch xuống 20px và đẩy đoạn văn phía sau xuống theo' },
      { content: 'Khối được đặt cách mép trên của phần tử cha đúng 20px' },
      { content: 'Khối dịch xuống 20px, chỗ cũ vẫn giữ nguyên, đoạn sau không dịch', correct: true },
      { content: 'Khối được đặt cách mép trên của trang 20px và không còn chiếm chỗ' },
    ],
  },

  // ───── medium (14) ─────
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Viewport rộng 1024px. \`.col\` rộng bao nhiêu, và vì sao?

\`\`\`html
<style>
  @media (min-width: 768px) { .col { width: 50%; } }
  .col { width: 100%; }
</style>
<div class="col">Nội dung</div>
\`\`\``,
    options: [
      { content: '50%, vì rule trong `@media` có độ ưu tiên cao hơn rule ngoài nó' },
      { content: '100%, vì `@media` không tăng specificity, rule sau thắng', correct: true },
      { content: '50%, vì viewport 1024px thoả điều kiện `min-width: 768px`' },
      { content: '100%, vì `min-width: 768px` khớp khi viewport nhỏ hơn 768px' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: 'Khối hero đặt `height: 100vh`. Trên trình duyệt di động (Safari iOS, Chrome Android), lúc thanh địa chỉ đang hiện thì phần đáy hero bị khuất dưới mép màn hình. Giải thích và cách sửa nào đúng?',
    options: [
      { content: '`vh` tính theo pixel vật lý nên quá lớn; dùng `height: 100%` thay thế' },
      { content: '`100vh` cộng thêm margin 8px mặc định của `body`; đặt `body { margin: 0 }`' },
      { content: '`vh` được tính một lần lúc tải trang; đổi sang `min-height: 100vh`' },
      { content: '`vh` ứng với viewport lớn (thanh công cụ thu lại); dùng `100svh`/`100dvh`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `\`padding-top\` và \`margin-top\` của \`.child\` bằng bao nhiêu?

\`\`\`html
<style>
  .parent { width: 400px; height: 200px; }
  .child { padding-top: 25%; margin-top: 10%; }
</style>
<div class="parent"><div class="child"></div></div>
\`\`\``,
    options: [
      { content: 'padding-top 50px, margin-top 20px' },
      { content: 'padding-top 100px, margin-top 40px', correct: true },
      { content: 'padding-top 100px, margin-top 20px' },
      { content: 'padding-top 50px, margin-top 40px' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `\`.child\` (box-sizing mặc định, không padding/border, hướng LTR) hiển thị thế nào trong \`.parent\`?

\`\`\`css
.parent { width: 400px; }
.child { width: 100%; margin: 0 20px; }
\`\`\``,
    options: [
      { content: 'Rộng 360px, vì `100%` là phần còn lại sau khi trừ margin hai bên' },
      { content: 'Rộng 440px, vì margin được cộng vào bên trong `width: 100%`' },
      { content: 'Rộng 400px, bắt đầu cách mép trái 20px nên tràn ra phải 20px', correct: true },
      { content: 'Rộng 400px, margin bị bỏ qua nên nằm khít trong `.parent`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: 'Container `display: flex; width: 600px` có hai item A, B đều `flex: auto`; nội dung (max-content) rộng lần lượt 100px và 300px; không padding, border, gap. Kích thước cuối của A và B?',
    options: [
      { content: 'A 300px, B 300px' },
      { content: 'A 200px, B 400px', correct: true },
      { content: 'A 150px, B 450px' },
      { content: 'A 100px, B 300px, còn trống 200px' },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: 'Thanh điều hướng `display: flex` có 4 item theo thứ tự: Logo, Khoá học, Blog, Đăng nhập. Muốn chỉ "Đăng nhập" nằm sát mép phải, ba item còn lại giữ bên trái, không sửa HTML. Những cách nào đạt được?',
    options: [
      { content: '`justify-self: end` cho "Đăng nhập"' },
      { content: '`margin-left: auto` cho "Đăng nhập"', correct: true },
      { content: '`align-self: flex-end` cho "Đăng nhập"' },
      { content: '`margin-right: auto` cho "Blog"', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: 'Grid container rộng 1000px, không gap, chỉ có 2 item. Mỗi item rộng bao nhiêu với `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` và với `repeat(auto-fit, minmax(200px, 1fr))`?',
    options: [
      { content: 'auto-fill: 500px; auto-fit: 200px' },
      { content: 'Cả hai: 500px' },
      { content: 'Cả hai: 200px' },
      { content: 'auto-fill: 200px; auto-fit: 500px', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: `Với đoạn HTML dưới đây, những phát biểu nào đúng?

\`\`\`html
<div class="list">
  <h3>Tiêu đề</h3>
  <p>A</p>
  <p>B</p>
  <p>C</p>
</div>
\`\`\``,
    options: [
      { content: '`.list p:nth-child(2)` chọn đoạn A', correct: true },
      { content: '`.list p:first-child` chọn đoạn A' },
      { content: '`.list p:nth-of-type(2)` chọn đoạn B', correct: true },
      { content: '`.list :nth-child(odd)` chọn đoạn A và C' },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: 'Cho `.box { --s: 8; --m: 10px; }`. Những khai báo nào (đặt trong `.box`) hợp lệ và cho đúng giá trị ghi bên cạnh?',
    options: [
      { content: '`padding: calc(var(--s) * 1px);` → 8px', correct: true },
      { content: '`padding: var(--s)px;` → 8px' },
      { content: '`margin: calc(var(--m) * 2px);` → 20px' },
      { content: '`margin: var(--m) * 2;` → 20px' },
      { content: '`margin: calc(var(--m) * 2);` → 20px', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Ở phần chồng lên nhau 20px, banner đè lên menu. Vì sao?

\`\`\`html
<div class="menu" style="z-index: 100; margin-bottom: -20px; background: white;">
  Menu
</div>
<div class="banner" style="position: relative; background: gold;">
  Banner
</div>
\`\`\``,
    options: [
      { content: '`.menu` là static nên `z-index` vô hiệu; khối định vị được vẽ sau khối thường', correct: true },
      { content: '`position: relative` khiến `.banner` tạo stacking context mới nên được vẽ phía trên' },
      { content: 'Margin âm đưa `.menu` ra khỏi luồng bình thường, nên `z-index` của nó bị bỏ qua' },
      { content: 'Cha của `.menu` có `z-index: auto` nên giá trị 100 bị vô hiệu' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Trong 2 giây đầu sau khi trang tải (trước khi animation chạy), \`.box\` nằm ở đâu?

\`\`\`css
@keyframes slide-in {
  from { transform: translateX(-100px); }
  to   { transform: translateX(0); }
}
.box { animation: slide-in 1s ease-out 2s; }
\`\`\``,
    options: [
      { content: 'Ở -100px, vì keyframe `from` được áp dụng ngay khi gán animation' },
      { content: 'Bị ẩn đi, rồi xuất hiện ở -100px khi animation bắt đầu' },
      { content: 'Ở vị trí gốc (0), rồi giật về -100px khi animation bắt đầu', correct: true },
      { content: 'Ở -100px, vì giá trị mặc định của `animation-fill-mode` là `both`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Thẻ \`<span>\` không đặt \`top\`/\`right\`/\`bottom\`/\`left\`. Nó hiển thị ở đâu?

\`\`\`html
<div class="card" style="position: relative;">
  <h3>Tiêu đề</h3>
  <span style="position: absolute;">Mới</span>
  <p>Mô tả khoá học...</p>
</div>
\`\`\``,
    options: [
      { content: 'Góc trên-trái của `.card`, vì các offset mặc định bằng 0' },
      { content: 'Tại vị trí tĩnh (ngay dưới `<h3>`), không chiếm chỗ nên `<p>` dồn lên', correct: true },
      { content: 'Ngay dưới `<h3>` và vẫn giữ chỗ như một phần tử inline bình thường' },
      { content: 'Góc trên-trái của trang, vì không có offset thì bỏ qua cha `relative`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Người dùng rê chuột vào nút rồi rê ra. Màu nền thay đổi thế nào?

\`\`\`css
.btn { background-color: gray; }
.btn:hover {
  background-color: navy;
  transition: background-color 0.3s;
}
\`\`\``,
    options: [
      { content: 'Chuyển mượt cả khi rê chuột vào lẫn khi rê chuột ra' },
      { content: 'Đổi tức thì khi rê vào, chuyển mượt khi rê ra' },
      { content: 'Không mượt ở cả hai chiều, vì `transition` phải đặt ở `.btn`' },
      { content: 'Chuyển mượt khi rê vào, đổi tức thì khi rê ra', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: 'Menu trượt vào bằng `transition: left 0.3s` (`left` từ `-300px` về `0`) bị giật trên điện thoại cấu hình yếu. Thay đổi nào thường cải thiện rõ nhất?',
    options: [
      { content: 'Thêm `will-change: left` để trình duyệt chuẩn bị trước cho thay đổi' },
      { content: 'Đổi sang animate `margin-left`, vì margin nhẹ hơn thuộc tính định vị' },
      { content: 'Animate `transform: translateX()`, vì không phải tính lại layout mỗi frame', correct: true },
      { content: 'Đổi timing function sang `linear` để giảm khối lượng tính mỗi frame' },
    ],
  },

  // ───── hard (13) ─────
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Trang không có phần tử nào mang \`id="a"\`. Chữ "Xin chào" màu gì?

\`\`\`html
<style>
  :is(#a, .b) p { color: red; }
  .b p.x { color: blue; }
</style>
<div class="b"><p class="x">Xin chào</p></div>
\`\`\``,
    options: [
      { content: 'Xanh, vì phần tử khớp `:is()` qua `.b` nên selector đầu thành (0,1,1)' },
      { content: 'Đỏ, vì `:is()` lấy specificity của đối số cao nhất (`#a`), thành (1,0,1)', correct: true },
      { content: 'Xanh, vì `:is()` không đóng góp specificity, giống như `:where()`' },
      { content: 'Đỏ, vì `:is()` cộng dồn specificity của các đối số, thành (1,1,1)' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Những phát biểu nào đúng về nút "Lưu"?

\`\`\`html
<style>
  @layer base, components;
  @layer components { .btn { color: blue; } }
  @layer base { #app .btn { color: red; padding: 8px !important; } }
  .btn { color: green; padding: 4px; }
</style>
<div id="app"><button class="btn">Lưu</button></div>
\`\`\``,
    options: [
      { content: 'Chữ màu red, vì `#app .btn` có specificity cao nhất' },
      { content: 'Chữ màu green, vì khai báo thường ngoài layer thắng khai báo thường trong layer', correct: true },
      { content: 'Chữ màu blue, vì layer `components` được khai báo sau `base`' },
      { content: 'Nếu rule ngoài layer đổi thành `padding: 4px !important` thì padding là 4px, vì style ngoài layer ưu tiên hơn' },
      { content: 'Padding là 8px, vì `!important` trong layer thắng khai báo thường ngoài layer', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: 'Trong `.wrap` (đang là block thường), khối A có `margin-bottom: 30px`, khối B ngay sau có `margin-top: 20px`; khoảng cách giữa A và B đang là 30px. Thay đổi nào làm khoảng cách đó thành 50px?',
    options: [
      { content: 'Thêm `border-bottom: 1px solid` cho A' },
      { content: 'Đặt `overflow: hidden` cho `.wrap`' },
      { content: 'Đặt `display: flex; flex-direction: column` cho `.wrap`', correct: true },
      { content: 'Đặt `display: grid` cho `.wrap`', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `\`.main\` bị nới rộng theo \`<pre>\` và tràn khỏi \`.row\`, thay vì để \`<pre>\` tự cuộn ngang. Sửa thế nào cho đúng gốc?

\`\`\`html
<style>
  .row { display: flex; width: 400px; }
  .side { flex: 0 0 120px; }
  .main { flex: 1; }
  pre { overflow-x: auto; }
</style>
<div class="row">
  <aside class="side">Menu</aside>
  <div class="main"><pre>một dòng code dài khoảng 900px...</pre></div>
</div>
\`\`\``,
    options: [
      { content: 'Đổi `.main` thành `flex: 1 1 0`, vì `flex: 1` vẫn giữ `flex-basis: auto`' },
      { content: 'Thêm `flex-shrink: 1` cho `.main`, vì `flex: 1` tắt khả năng co lại' },
      { content: 'Thêm `width: 100%` cho `.main` để nó không rộng hơn `.row`' },
      { content: 'Thêm `min-width: 0` cho `.main`, vì mặc định nó không co dưới min-content', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: 'Container `display: flex; width: 500px` chứa A `flex: 0 1 400px` và B `flex: 0 3 200px`; nội dung đều là chữ ngắn, không padding, border, gap. Kích thước cuối của A và B?',
    options: [
      { content: 'A 360px, B 140px', correct: true },
      { content: 'A 350px, B 150px' },
      { content: 'A 375px, B 125px' },
      { content: 'A 333.33px, B 166.67px' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `\`.wrap\` là block thường, trang ở standards mode. \`.box\` cao bao nhiêu?

\`\`\`html
<style>
  .wrap { min-height: 400px; }
  .box { height: 50%; background: gold; }
</style>
<div class="wrap"><div class="box">Một dòng chữ</div></div>
\`\`\``,
    options: [
      { content: '200px, tức 50% của `min-height` 400px của cha' },
      { content: '0px, vì cha có `height: auto` nên 50% của 0 vẫn là 0' },
      { content: 'Cao bằng nội dung: cha không có `height` xác định nên 50% thành `auto`', correct: true },
      { content: '50% chiều cao viewport, vì `%` dò lên tổ tiên có chiều cao xác định' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: 'Trang cuộn bằng thanh cuộn của cửa sổ. Header đặt `position: sticky; top: 0` nhưng không dính lại khi cuộn. Những nguyên nhân nào có thể gây ra điều đó?',
    options: [
      { content: 'Phần tử cha của header không có `position: relative`' },
      { content: 'Một `div` bọc ngoài header có `overflow-x: hidden` để chặn cuộn ngang', correct: true },
      { content: 'Phần tử cha trực tiếp của header chỉ cao vừa bằng header', correct: true },
      { content: 'Sticky dính trong phần tử có `overflow: auto`, không dính theo cửa sổ trình duyệt' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `\`.toast\` hiển thị ở đâu?

\`\`\`html
<style>
  .card { transform: translateY(0); }
  .toast { position: fixed; right: 16px; bottom: 16px; }
</style>
<div class="card">
  <p>Nội dung thẻ...</p>
  <div class="toast">Đã lưu</div>
</div>
\`\`\``,
    options: [
      { content: 'Góc dưới-phải viewport, vì phần tử `fixed` lấy viewport làm khối chứa' },
      { content: 'Góc dưới-phải của `.card`, cuộn theo nó, vì `transform` làm `.card` thành khối chứa', correct: true },
      { content: 'Góc dưới-phải viewport, vì `.card` thiếu `position: relative` nên không làm khối chứa' },
      { content: 'Ở vị trí tĩnh trong `.card`, vì `transform` khiến `right`/`bottom` bị bỏ qua' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Item ở cột 1 chứa một URL không ngắt dòng được (min-content 300px), item ở cột 2 không có nội dung. Hai cột rộng bao nhiêu?

\`\`\`css
.grid {
  display: grid;
  width: 400px;
  grid-template-columns: 1fr 1fr;
}
\`\`\``,
    options: [
      { content: '200px và 200px, URL tràn sang cột 2' },
      { content: '300px và 200px, lưới tràn ra ngoài 100px' },
      { content: '350px và 50px, 100px còn dư chia đều cho hai cột' },
      { content: '300px và 100px, lưới vừa khít 400px', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Mỗi phương án là một khai báo riêng, thêm vào rule \`.x { … }\` (thắng được rule \`p\`). Những phát biểu nào đúng?

\`\`\`html
<style>
  p { display: flex; color: red; }
</style>
<div style="color: green"><p class="x">Nội dung</p></div>
\`\`\``,
    options: [
      { content: '`display: initial` → `<p>` hiển thị `inline` (giá trị khởi tạo)', correct: true },
      { content: '`display: revert` → `<p>` hiển thị `block` theo stylesheet của trình duyệt', correct: true },
      { content: '`display: unset` → `<p>` hiển thị `block`, giá trị mặc định của thẻ `<p>`' },
      { content: '`color: initial` → chữ màu green, giá trị kế thừa từ thẻ cha của `<p>`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Chữ "Ghi chú" màu gì?

\`\`\`html
<style>
  :root { --c: blue; }
  p { color: red; }
  .note { --c: 20px; color: var(--c); }
</style>
<div style="color: green"><p class="note">Ghi chú</p></div>
\`\`\``,
    options: [
      { content: 'Đỏ, vì khai báo lỗi bị bỏ qua và rule `p` phía trên được dùng' },
      { content: 'Xanh dương, vì `--c: 20px` không phải màu nên dùng `--c` của `:root`' },
      { content: 'Xanh lá, vì giá trị lỗi lúc tính thành `unset`, và `color` kế thừa', correct: true },
      { content: 'Đen, vì giá trị lỗi lúc tính khiến `color` quay về `initial`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Tooltip chồng lên vùng của \`.b\`. Phần tử nào hiện ở trên, và vì sao?

\`\`\`html
<div class="a" style="opacity: 0.99;">
  <div class="tip" style="position: absolute; z-index: 100;">Tooltip</div>
</div>
<div class="b" style="position: relative; z-index: 1;">Card</div>
\`\`\``,
    options: [
      { content: 'Card ở trên: `opacity` < 1 tạo stacking context, cả `.a` xếp ở mức z-index 0', correct: true },
      { content: 'Tooltip ở trên: z-index 100 của nó lớn hơn z-index 1 của `.b`' },
      { content: 'Tooltip ở trên: `opacity` đổi độ trong suốt nhưng không đổi thứ tự xếp lớp' },
      { content: 'Card ở trên: `.b` đứng sau `.a` trong DOM, và thứ tự DOM được xét trước z-index' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `\`line-height\` của \`.child\` là bao nhiêu?

\`\`\`html
<style>
  .parent { font-size: 10px; line-height: 150%; }
  .child { font-size: 30px; }
</style>
<div class="parent"><p class="child">Dòng 1<br>Dòng 2</p></div>
\`\`\``,
    options: [
      { content: '45px, vì 150% được tính lại theo font-size 30px của `.child`' },
      { content: '22.5px, vì `.child` lấy 150% của line-height 15px của cha' },
      { content: 'Khoảng 36px (`normal`), vì `line-height` không được kế thừa' },
      { content: '15px, vì 150% được đổi ra px ở `.parent` rồi mới kế thừa', correct: true },
    ],
  },
];
