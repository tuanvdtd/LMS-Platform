# PROMPT THIẾT KẾ GIAO DIỆN FRONTEND — SKILLPATH (Học viên + Giảng viên)

> Copy toàn bộ nội dung bên dưới đường kẻ để đưa cho AI thiết kế/code UI (v0, Lovable, Claude, Cursor, Figma AI…).

---

## 0. Vai trò của bạn

Bạn là một **Senior Product Designer kiêm Frontend Engineer**, có kinh nghiệm thiết kế các nền tảng e-learning thương mại như **Udemy**, Coursera, LeetCode, Codecademy. Nhiệm vụ: thiết kế và dựng giao diện frontend hoàn chỉnh (UI tĩnh chạy được với mock data) cho nền tảng **SkillPath** — trong giai đoạn này **chỉ làm 2 vai trò: Học viên (student) và Giảng viên (instructor)**. Chưa làm giao diện Admin (chỉ cần các trạng thái "chờ admin duyệt / bị từ chối" hiển thị phía giảng viên và học viên).

## 1. Bối cảnh sản phẩm

**SkillPath** là nền tảng thương mại khoá học IT, khác Udemy ở 3 điểm cốt lõi — giao diện phải làm nổi bật 3 điểm này:

1. **Đánh giá năng lực tự động**: mỗi khoá có bài trắc nghiệm và bài tập lập trình được chấm tự động trong sandbox (kết quả: Accepted / Wrong Answer / Time Limit Exceeded / Runtime Error / Compile Error, điểm theo số test đạt). Mỗi câu hỏi gắn **tag kỹ năng** (vd `react-hooks`, `sql-join`) → hệ thống tính **độ thành thạo từng kỹ năng** (0–100%) của học viên.
2. **Gợi ý lộ trình cá nhân hoá, có giải thích lý do**: gợi ý dựa trên năng lực thực tế, ví dụ *"Gợi ý vì bạn đạt 35% ở kỹ năng React Hooks"*, *"Bạn đã vững JavaScript → sẵn sàng học React"*.
3. **Dashboard phân tích học tập sâu cho giảng viên**: doanh thu, phễu chuyển đổi, đường giữ chân video, điểm tua lại, chất lượng câu hỏi (độ khó, độ phân biệt, đáp án nhiễu), heatmap kỹ năng yếu của lớp, cảnh báo học viên nguy cơ bỏ học.

Nội dung do **giảng viên đã được xác minh** đăng; khoá học phải được **admin duyệt** mới được bán. Học viên có thể **báo cáo vi phạm** nội dung.

## 2. Ràng buộc kỹ thuật

- **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4**. Project đã có sẵn tại `it-course-platform/src/app`.
- Biểu đồ: **Recharts**. Icon: **lucide-react**. Component nền: **shadcn/ui** (Radix) — được phép dùng.
- Code editor cho bài tập lập trình: **Monaco Editor** (`@monaco-editor/react`).
- Frontend **chỉ làm UI**, gọi REST API NestJS riêng. Giai đoạn này dùng **mock data** đặt trong `src/mocks/*.ts`, tách lớp gọi dữ liệu thành hàm (vd `getCourse(id)`) để sau thay bằng API thật.
- Xác thực bằng cookie session (Better Auth) — UI chỉ cần form, không cần tự xử lý token.
- Thanh toán: nút "Thanh toán" chuyển sang Stripe Checkout (mock: chuyển sang trang success).
- Kết quả chấm bài code trả về dần qua **SSE** → UI phải có trạng thái "đang chấm" hiển thị từng test case lần lượt chuyển trạng thái.
- Ngôn ngữ giao diện: **Tiếng Việt** (định dạng tiền `₫`, ngày `dd/MM/yyyy`). Chuẩn bị sẵn cấu trúc cho i18n nhưng chưa cần làm.
- Responsive: desktop-first cho dashboard giảng viên, **mobile-friendly** cho toàn bộ trang học viên (xem khoá, học video, làm trắc nghiệm). Trang làm bài code trên mobile chỉ cần hiển thị đề + thông báo "nên dùng máy tính".
- Accessibility: tương phản AA, focus ring rõ ràng, điều hướng bàn phím, `aria-label` cho icon button, không truyền đạt thông tin chỉ bằng màu (luôn kèm icon/chữ).

## 3. Design system

**Cảm hứng**: bố cục và độ đặc thông tin của **Udemy** (header có search lớn, card khoá học, trang chi tiết có sidebar giá dính, trình phát bài học có danh sách chương bên phải, Instructor dashboard có sidebar trái) + chất "developer" của LeetCode (editor, kết quả test).

- **Màu thương hiệu**:
  - Primary **xanh dương `#2563EB`** (blue-600; hover `#1D4ED8`, nền nhạt `#EFF6FF`) — header, link, nút chính, trạng thái active, biểu đồ chính.
  - Accent **cam `#F97316`** (orange-500; hover `#EA580C`) — dùng tiết chế cho CTA mua hàng ("Thêm vào giỏ", "Mua ngay"), badge giảm giá, điểm nhấn gợi ý/lộ trình.
  - Nền tối (dark mode) **`#0F172A`** (slate-900), bề mặt card `#1E293B`; chữ và viền dùng thang slate.
  - Định nghĩa tất cả màu bằng CSS variables (token) trong `globals.css`, không hard-code mã màu trong component.
- **Màu ngữ nghĩa** (dùng thống nhất toàn app):
  - Mức thành thạo kỹ năng: `< 40%` đỏ (Yếu), `40–70%` vàng (Trung bình), `≥ 70%` xanh lá (Vững).
  - Kết quả chấm: Accepted xanh lá, Wrong Answer đỏ, TLE vàng đậm (amber — không dùng cam để tránh trùng accent), Runtime/Compile Error tím, Pending xám + spinner.
  - Trạng thái khoá học: Nháp (xám), Chờ duyệt (vàng), Đã duyệt/Đang bán (xanh), Bị từ chối (đỏ), Bị ẩn (xám đậm).
- **Dark mode** đầy đủ (toggle trên header, mặc định theo hệ thống). Editor code dùng theme tối.
- Typography: font sans hỗ trợ tiếng Việt tốt (Inter hoặc Be Vietnam Pro), font mono cho code (JetBrains Mono).
- Bo góc 8–12px, shadow nhẹ, khoảng trắng thoáng; card khoá học tỉ lệ ảnh 16:9.
- Mọi danh sách/bảng/biểu đồ đều có đủ 4 trạng thái: **loading (skeleton)**, **empty (minh hoạ + CTA)**, **error (nút thử lại)**, **có dữ liệu**.

**Component dùng chung cần xây** (đặt trong `src/components`):
`CourseCard`, `RatingStars`, `PriceTag` (giá gốc gạch ngang + giá giảm), `SkillTag` (chip tag kỹ năng), `SkillMasteryBar`, `SkillRadarChart`, `RecommendationCard` (có dòng **"Vì sao gợi ý?"**), `ProgressRing`, `StatusBadge`, `VerdictBadge` (AC/WA/TLE/RE/CE), `CurriculumAccordion`, `VideoPlayer` (có tốc độ phát, tua 10s, phụ đề, nhớ vị trí), `StatCard` (số + % thay đổi so với kỳ trước), `DateRangeFilter`, `CourseFilter`, `DataTable` (sort, phân trang, xuất CSV), `EmptyState`, `ConfirmDialog`, `Stepper`.

## 4. Cấu trúc điều hướng

- **Header công khai / học viên** (giống Udemy): logo · "Danh mục" (mega menu theo track: Frontend, Backend, Data, DevOps, Mobile…) · ô tìm kiếm lớn · "Dạy trên SkillPath" · icon giỏ hàng (badge số lượng) · thông báo · avatar menu (Học tập của tôi, Hồ sơ năng lực, Chứng chỉ, Lịch sử mua hàng, Cài đặt, Chuyển sang chế độ Giảng viên, Đăng xuất).
- **Layout giảng viên** (giống Udemy Instructor): sidebar trái thu gọn được — Tổng quan · Khoá học · Ngân hàng câu hỏi · Bài tập lập trình · Phân tích (Doanh thu, Hành vi học, Chất lượng bài kiểm tra, Học viên) · Hồ sơ giảng viên · Nút "Chuyển sang chế độ Học viên".
- Một tài khoản giảng viên cũng có thể mua/học như học viên.

## 5. Các màn hình — HỌC VIÊN

### 5.1. Xác thực & onboarding
1. **Đăng nhập / Đăng ký**: email + mật khẩu, nút Google / GitHub, quên mật khẩu, đặt lại mật khẩu, màn hình "kiểm tra email để xác minh".
2. **Onboarding sau đăng ký** (stepper 3 bước, bỏ qua được): (1) chọn **mục tiêu** (Frontend / Backend / Fullstack / Data / DevOps / Mobile — dạng card có icon), (2) chọn **trình độ hiện tại** (Mới bắt đầu / Cơ bản / Trung cấp / Nâng cao), (3) chọn kỹ năng đã biết (chip multi-select). Kết thúc → trang chủ cá nhân hoá. Đây là dữ liệu cho gợi ý "cold start".

### 5.2. Trang chủ
- **Khách chưa đăng nhập**: hero (slogan về "học đúng thứ bạn còn thiếu"), giải thích 3 bước (Học → Làm bài được chấm tự động → Nhận lộ trình), khoá nổi bật theo track (carousel tab giống Udemy), danh mục phổ biến, giảng viên tiêu biểu, CTA đăng ký.
- **Học viên đã đăng nhập**:
  - "Tiếp tục học" — hàng card có thanh tiến độ, bài đang dở.
  - **Khối "Kỹ năng bạn cần củng cố"**: 3–5 kỹ năng yếu nhất với `SkillMasteryBar` + link bài học nên ôn lại.
  - Các hàng gợi ý, mỗi hàng ghi rõ nguồn gợi ý:
    - "Dành cho mục tiêu Backend của bạn" (tầng mục tiêu)
    - "Lấp lỗ hổng kỹ năng" — mỗi card có lý do *"Vì bạn đạt 35% ở React Hooks"* (tầng kỹ năng, **nổi bật nhất**)
    - "Bạn đã sẵn sàng học tiếp" — *"Bạn đã vững JavaScript (82%) → React"*
    - "Học viên học [khoá X] cũng mua…"
    - "Có nội dung tương tự [khoá vừa học]"
  - Mỗi `RecommendationCard` có nút "Không quan tâm" và tooltip "Vì sao tôi thấy gợi ý này?".

### 5.3. Tìm kiếm & danh mục
- Trang kết quả giống Udemy: bộ lọc bên trái (track, trình độ, đánh giá, giá, thời lượng, ngôn ngữ, **có bài tập lập trình**, **có chứng chỉ**), sắp xếp (Phù hợp nhất, Phổ biến, Đánh giá cao, Mới nhất), danh sách card dạng ngang trên desktop. Hover card hiện popover tóm tắt "Bạn sẽ học được" + nút thêm giỏ.
- Trang danh mục theo track: banner, khoá bán chạy, lộ trình kỹ năng của track (sơ đồ JS → React → Next.js).

### 5.4. Chi tiết khoá học (tham khảo sát trang course của Udemy)
- Hero tối màu: breadcrumb, tên khoá, mô tả ngắn, rating + số đánh giá + số học viên, giảng viên, cập nhật lần cuối, ngôn ngữ, badge "Đã được SkillPath kiểm duyệt".
- **Sidebar giá dính (sticky)**: video preview, giá, % giảm, nút "Thêm vào giỏ", "Mua ngay", danh sách "Khoá học bao gồm" (giờ video, số bài test, số bài code, chứng chỉ, truy cập trọn đời). Nếu đã mua → nút "Vào học".
- Nội dung chính:
  - "Bạn sẽ học được" (checklist 2 cột)
  - **"Kỹ năng đạt được"**: các `SkillTag`; nếu đã đăng nhập, mỗi tag hiển thị mức hiện tại của học viên.
  - **"Yêu cầu tiên quyết"**: kỹ năng tiên quyết + trạng thái của học viên (✓ đã vững / ⚠ còn yếu — kèm gợi ý khoá bổ trợ).
  - Nội dung khoá (`CurriculumAccordion`: chương → bài; icon phân biệt video / trắc nghiệm / bài code; thời lượng; bài "Xem trước" miễn phí).
  - Mô tả, "Khoá này dành cho ai".
  - Giảng viên (avatar, tiêu đề, rating, số học viên, số khoá, bio, badge "Giảng viên đã xác minh").
  - Đánh giá: điểm trung bình, phân bố 5→1 sao, danh sách review, lọc theo sao.
  - "Học viên cũng mua", "Khoá tương tự".
  - Link nhỏ "Báo cáo vi phạm" (mở dialog: chọn lý do — nội dung sai / vi phạm bản quyền / khác, mô tả, đính kèm link).

### 5.5. Giỏ hàng & thanh toán
- Giỏ hàng: danh sách khoá, xoá / chuyển sang "Để dành", tổng tiền, ô mã giảm giá, nút "Thanh toán" (→ Stripe). Gợi ý "Thường được mua cùng".
- Trang thanh toán thành công (confetti nhẹ, nút "Bắt đầu học") và thất bại/huỷ.
- Lịch sử mua hàng: bảng đơn hàng, trạng thái (Đã thanh toán / Đã hoàn tiền), nút yêu cầu hoàn tiền.

### 5.6. Học tập của tôi
- Tab: Tất cả khoá · Đang học · Đã hoàn thành · Danh sách yêu thích. Card có tiến độ %, nút tiếp tục, lọc/sắp xếp.

### 5.7. Trình học bài (Course player — giống Udemy learning view)
- Layout toàn màn hình: thanh trên (logo, tên khoá, tiến độ ring, nút đánh giá, chia sẻ), vùng nội dung trái, **sidebar nội dung khoá bên phải** (checkbox hoàn thành từng bài, bài hiện tại highlight, thu gọn được; trên mobile chuyển xuống dưới).
- Bài **video**: `VideoPlayer` tự nhớ vị trí, tự đánh dấu hoàn thành khi xem ≥ 90%, nút "Bài tiếp theo" đếm ngược. Video chỉ phát khi đã mua (hiển thị trạng thái "link hết hạn — đang tải lại" nếu lỗi).
- Tab dưới video: Tổng quan · Hỏi đáp · Ghi chú (gắn timestamp) · Tài liệu đính kèm · Thông báo.
- Nếu hệ thống phát hiện kỹ năng yếu → banner nhẹ trong player: *"Bạn đạt 40% ở `sql-join` — nên xem lại bài 3.2"*.

### 5.8. Làm bài trắc nghiệm
- Màn hình bắt đầu: số câu, thời gian, điểm đạt, số lần làm còn lại, kỹ năng được đánh giá.
- Khi làm: đồng hồ đếm ngược, thanh điều hướng câu (đã làm / chưa làm / đánh dấu xem lại), 1 câu/trang hoặc cuộn, hỗ trợ đoạn code trong câu hỏi (syntax highlight), chọn 1 hoặc nhiều đáp án. Cảnh báo khi hết giờ / thoát trang.
- **Kết quả**: điểm lớn, đạt/không đạt, thời gian, **điểm theo từng kỹ năng** (bar), xem lại từng câu (đúng/sai, đáp án đúng, giải thích), khối "Nên ôn lại" liên kết bài học, nút "Làm lại".

### 5.9. Làm bài tập lập trình (tham khảo LeetCode)
- Layout 2 cột chia được bằng kéo: **trái** — tab Đề bài (markdown, ví dụ input/output, ràng buộc, giới hạn thời gian & bộ nhớ, tag kỹ năng) · Lịch sử nộp bài; **phải** — chọn ngôn ngữ (Python, JavaScript, C++, Java…), Monaco Editor, nút Reset code, panel dưới có tab "Test case" (các test công khai, cho tự thêm input) và "Kết quả".
- Nút **"Chạy thử"** (chỉ test công khai) và **"Nộp bài"** (cả test ẩn).
- Trạng thái chấm realtime: danh sách test lần lượt `Pending → Running → AC/WA/TLE/RE`, test ẩn chỉ hiện "Test ẩn #3 — Wrong Answer" không lộ dữ liệu. Tổng kết: verdict tổng, số test đạt / tổng, điểm, thời gian chạy, bộ nhớ. Với WA ở test công khai: so sánh Expected vs Output. Với RE/CE: hiện stderr.
- Hiển thị giới hạn "Bạn đã nộp quá nhanh, thử lại sau 10 giây" (rate limit).

### 5.10. Hồ sơ năng lực (trang đặc trưng — đầu tư thiết kế nhất)
- Tổng quan: mục tiêu, trình độ, số kỹ năng đã vững / đang học / yếu.
- **Radar chart** theo nhóm kỹ năng + **danh sách kỹ năng** với `SkillMasteryBar`, số bài kiểm tra đã làm cho mỗi kỹ năng, xu hướng (↑↓), lọc theo track.
- **Sơ đồ lộ trình kỹ năng** (graph tiên quyết dạng node-link: JS → React → Next.js), node tô màu theo mức thành thạo, node bị khoá nếu chưa vững tiên quyết; click node → khoá học/bài học liên quan.
- Lịch sử điểm theo thời gian (line chart).
- Khối "Lộ trình đề xuất tiếp theo" (danh sách có thứ tự, mỗi bước ghi lý do).

### 5.11. Chứng chỉ
- Danh sách chứng chỉ (thumbnail, khoá, ngày cấp), xem chi tiết, tải PDF, chia sẻ LinkedIn, copy link.
- **Trang xác thực công khai** `/verify/[code]` (mở từ QR): tên học viên, khoá, giảng viên, ngày cấp, mã, trạng thái "Hợp lệ ✓" hoặc "Không tồn tại".
- Tiến độ đến chứng chỉ trong khoá: "Hoàn thành 80% bài học + đạt bài test cuối khoá ≥ 70%".

### 5.12. Khác
- Hồ sơ cá nhân & cài đặt (thông tin, avatar, đổi mật khẩu, tài khoản liên kết, tuỳ chọn email thông báo, đổi mục tiêu học).
- Trung tâm thông báo (kết quả chấm xong, khoá mới phù hợp, nhắc học).
- Trang "Trở thành giảng viên" (landing giới thiệu + CTA nộp hồ sơ).
- Trang 404, 403 (không có quyền), 500.

## 6. Các màn hình — GIẢNG VIÊN

### 6.1. Xác minh giảng viên (điều kiện trước khi tạo khoá)
- Form nộp hồ sơ nhiều bước: thông tin cá nhân & chuyên môn → bằng cấp/chứng chỉ (upload file) → kinh nghiệm làm việc → portfolio / GitHub / LinkedIn → xác nhận.
- Màn hình trạng thái: **Đang chờ duyệt** (timeline các bước), **Bị từ chối** (hiện lý do của admin + nút "Sửa và nộp lại"), **Đã xác minh** (badge). Khi chưa xác minh, các menu tạo khoá bị khoá kèm tooltip giải thích.

### 6.2. Tổng quan (Instructor home)
- Lời chào, 4 `StatCard`: Doanh thu tháng này, Học viên mới, Đánh giá trung bình, Học viên đang hoạt động (7 ngày) — mỗi thẻ có % so với kỳ trước + sparkline.
- **"Cần chú ý"**: khoá bị từ chối, báo cáo vi phạm mới, câu hỏi chất lượng kém, số học viên nguy cơ bỏ học, câu hỏi Q&A chưa trả lời.
- Biểu đồ doanh thu 30 ngày, top khoá học.

### 6.3. Quản lý khoá học
- Danh sách khoá: dạng bảng/card, thumbnail, `StatusBadge` (Nháp / Chờ duyệt / Đang bán / Bị từ chối / Bị ẩn), số học viên, doanh thu, rating, % hoàn thành nội dung soạn thảo, hành động (Sửa, Xem trước, Xem phân tích, Nhân bản).
- **Trình tạo/sửa khoá** (tham khảo Udemy course builder — sidebar trái các mục với checkmark khi hoàn thành):
  1. **Thông tin cơ bản**: tiêu đề, phụ đề, mô tả (rich text), track, trình độ, ngôn ngữ, ảnh bìa, video giới thiệu.
  2. **Mục tiêu & đối tượng**: "Học viên sẽ học được", yêu cầu, dành cho ai.
  3. **Kỹ năng**: chọn tag kỹ năng khoá dạy + kỹ năng tiên quyết (combobox tìm kiếm, tạo tag mới).
  4. **Chương trình học (Curriculum)**: kéo-thả chương và bài; mỗi bài chọn loại: Video (upload có thanh tiến độ, trạng thái xử lý), Bài đọc, Tài liệu đính kèm, **Bài trắc nghiệm** (chọn câu từ ngân hàng), **Bài tập lập trình**; bật "Cho xem trước".
  5. **Bài test cuối khoá & chứng chỉ**: chọn bài test, điểm đạt, điều kiện cấp chứng chỉ, xem trước mẫu chứng chỉ.
  6. **Giá**: nhập giá, giá khuyến mãi, xem trước doanh thu thực nhận sau phí.
  7. **Gửi duyệt**: checklist kiểm tra đủ nội dung, **checkbox bắt buộc "Tôi cam kết sở hữu bản quyền nội dung"**, nút Gửi duyệt. Khoá đang chờ duyệt chỉ đọc; bị từ chối → banner đỏ hiển thị lý do admin, chỉ ra mục cần sửa.
- Trang xem báo cáo vi phạm liên quan khoá (nội dung báo cáo, trạng thái xử lý, yêu cầu sửa từ admin).

### 6.4. Ngân hàng câu hỏi
- Bảng câu hỏi: nội dung rút gọn, loại (1 đáp án / nhiều đáp án), **tag kỹ năng**, độ khó do GV đặt, **độ khó thực tế & độ phân biệt** (từ dữ liệu, cờ cảnh báo nếu kém), số bài test đang dùng. Lọc theo khoá, tag, cảnh báo chất lượng.
- Form tạo/sửa câu hỏi: nội dung (markdown + code block), các đáp án (thêm/xoá/kéo thứ tự, đánh dấu đúng), giải thích, tag kỹ năng (bắt buộc ≥ 1), xem trước như học viên thấy. Hỗ trợ import CSV.
- Tạo bài kiểm tra: chọn câu thủ công hoặc ngẫu nhiên theo tag, thời gian, điểm đạt, số lần làm, xáo trộn câu/đáp án.

### 6.5. Bài tập lập trình
- Danh sách bài tập + tỉ lệ Accepted.
- Form tạo: đề bài (markdown, preview song song), tag kỹ năng, ngôn ngữ cho phép, code mẫu khởi đầu cho từng ngôn ngữ, **giới hạn thời gian (ms) & bộ nhớ (MB)**, quản lý test case (bảng input/expected output, bật/tắt "ẩn", trọng số điểm, import file), nút **"Chạy thử với lời giải mẫu"** để kiểm tra test case đúng.

### 6.6. Phân tích (Analytics) — mọi trang đều có `CourseFilter` + `DateRangeFilter` + nút **Xuất CSV**

**a) Doanh thu & bán hàng**
- StatCards: Tổng doanh thu, Doanh thu thực nhận (sau phí), Số đơn, Giá trị đơn TB, Tỉ lệ hoàn tiền.
- Line/area chart doanh thu theo ngày/tuần/tháng (toggle), stacked theo khoá.
- **Phễu chuyển đổi** (funnel chart): Xem trang khoá → Thêm giỏ → Bắt đầu thanh toán → Thành công, hiện % rớt giữa từng bước.
- Bảng so sánh khoá: doanh thu, học viên, rating, tỉ lệ hoàn tiền (sort được).

**b) Hành vi học**
- StatCards: Học viên hoạt động 7/30 ngày, Tỉ lệ hoàn thành khoá, Thời gian học TB.
- **Đường giữ chân video**: chọn video → line chart % người xem còn lại theo từng mốc thời gian, **đánh dấu điểm rơi bỏ** (annotation), vùng **tua lại nhiều** tô nổi bật (dạng heat strip dưới trục thời gian), tooltip gợi ý "Đoạn 04:30–05:10 bị xem lại nhiều — cân nhắc giải thích thêm".
- **Tiến độ theo bài**: bar chart ngang số học viên dừng ở từng bài (phát hiện bài "nút thắt").

**c) Chất lượng bài kiểm tra**
- Chọn bài kiểm tra → histogram phân bố điểm, điểm TB, tỉ lệ đạt.
- Bảng câu hỏi: **difficulty index** (% đúng), **discrimination index** (nhóm 27% cao vs 27% thấp), cờ màu (Tốt / Cần xem lại / Kém), click → **phân tích đáp án nhiễu** (bar tỉ lệ chọn từng đáp án, cảnh báo "Đáp án C không ai chọn — nên thay").
- Bài code: tỉ lệ Accepted, phân bố lỗi WA/TLE/RE (donut), số lần nộp TB đến khi đạt.
- **Heatmap kỹ năng yếu của lớp**: hàng = kỹ năng, cột = nhóm học viên hoặc bài kiểm tra, màu = mức thành thạo TB.

**d) Học viên**
- Bảng học viên: tên, tiến độ, điểm TB, lần hoạt động cuối, **điểm rủi ro bỏ học** (badge Thấp/TB/Cao), lọc "Cần chú ý".
- Trang chi tiết học viên: tiến độ, lịch sử điểm (line), **radar kỹ năng**, hoạt động gần đây, giải thích điểm rủi ro (vd "14 ngày không hoạt động · chậm hơn trung vị lớp 30% · điểm test thấp").
- Hành động: **gửi email nhắc nhở / động viên** (dialog có mẫu soạn sẵn, cho sửa, gửi hàng loạt cho nhiều học viên đã chọn).

### 6.7. Giao tiếp & hồ sơ
- Hỏi đáp: danh sách câu hỏi học viên theo khoá/bài, lọc chưa trả lời, trả lời inline.
- Đánh giá: danh sách review, phản hồi review.
- Hồ sơ giảng viên công khai (xem trước) + chỉnh sửa (bio, ảnh, link mạng xã hội).
- Cài đặt thanh toán/nhận tiền (UI placeholder).

## 7. Danh sách route đề xuất

```
(public)
/                               Trang chủ
/login  /register  /forgot-password  /reset-password  /verify-email
/onboarding
/courses                        Tìm kiếm / danh sách
/categories/[track]
/courses/[l1]/[l2]              Danh mục cấp 1 / cấp 2 (menu Khám phá)
/topic/[slug]                   Topic
/course/[slug]                  Chi tiết khoá
/instructors/[id]               Hồ sơ giảng viên công khai
/verify/[code]                  Xác thực chứng chỉ
/teach                          Landing trở thành giảng viên

(student)
/cart  /checkout/success  /checkout/cancel
/my-learning
/learn/[courseSlug]/[lessonId]  Trình học (video / đọc)
/learn/[courseSlug]/quiz/[quizId]
/learn/[courseSlug]/quiz/[quizId]/result/[attemptId]
/learn/[courseSlug]/code/[problemId]
/skills                         Hồ sơ năng lực
/certificates  /certificates/[id]
/orders  /notifications  /settings

(instructor)  — layout sidebar riêng
/instructor                     Tổng quan
/instructor/verification
/instructor/courses  /instructor/courses/new  /instructor/courses/[id]/edit/[section]
/instructor/questions  /instructor/questions/new  /instructor/quizzes/[id]
/instructor/problems  /instructor/problems/new
/instructor/analytics/revenue
/instructor/analytics/engagement
/instructor/analytics/assessments
/instructor/analytics/students  /instructor/analytics/students/[userId]
/instructor/qa  /instructor/reviews  /instructor/profile
```

## 8. Mock data yêu cầu

Tạo dữ liệu giả lập đủ thực tế (tiếng Việt, chủ đề IT) để mọi màn hình trông "thật":
- ~20 khoá học thuộc 5 track, đủ các trạng thái; mỗi khoá 4–8 chương, có video/quiz/code.
- ~40 tag kỹ năng + đồ thị tiên quyết (vd `js-basics → js-async → react-basics → react-hooks → nextjs-routing`).
- 1 học viên demo có điểm yếu rõ ràng (vd `react-hooks` 35%, `sql-join` 42%, `js-async` 88%) để các gợi ý có lý do hiển thị hợp lý.
- 1 giảng viên demo có 4 khoá, ~500 học viên, dữ liệu doanh thu 12 tháng, dữ liệu giữ chân video, 30 câu hỏi có đủ loại chất lượng (tốt/kém/đáp án nhiễu không ai chọn), 10 học viên nguy cơ bỏ học.
- Kết quả chấm code mẫu cho đủ verdict: AC, WA, TLE, RE, CE.

## 9. Kết quả cần bàn giao

1. Design tokens (`globals.css`) + bộ component dùng chung trong `src/components`.
2. Toàn bộ route ở mục 7 chạy được với mock data, điều hướng giữa các trang hoạt động.
3. Mỗi trang có đủ trạng thái loading / empty / error / data; responsive; dark mode.
4. Một file `DESIGN.md` ngắn mô tả: bảng màu, typography, quy tắc màu ngữ nghĩa, danh sách component.

**Thứ tự ưu tiên thực hiện** (làm lần lượt, mỗi bước xong mới sang bước sau):
1. Design system + layout (header học viên, sidebar giảng viên) + component nền.
2. Học viên: Trang chủ (có gợi ý kèm lý do) → Chi tiết khoá → Giỏ hàng → Trình học video.
3. Học viên: Làm trắc nghiệm + kết quả → Làm bài code → **Hồ sơ năng lực**.
4. Giảng viên: Xác minh → Quản lý & tạo khoá (course builder) → Ngân hàng câu hỏi → Bài tập code.
5. Giảng viên: Analytics a → b → c → d.
6. Phần còn lại: chứng chỉ + trang xác thực QR, onboarding, cài đặt, thông báo, Q&A, review.

**Nguyên tắc chung**: bố cục quen thuộc như Udemy để người dùng không phải học lại, nhưng mọi nơi liên quan đến **kỹ năng, gợi ý và phân tích** phải là điểm nhấn thị giác của SkillPath. Không nhồi nhét: mỗi màn hình trả lời rõ một câu hỏi của người dùng ("Tôi nên học gì tiếp?", "Tôi yếu ở đâu?", "Khoá của tôi có vấn đề ở đâu?").
