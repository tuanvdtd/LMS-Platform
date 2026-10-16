# Design System Master File — SkillPath

> **LOGIC:** When building a specific page, first check `design-system/skillpath/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file. Otherwise follow the rules below.

**Nguồn:** sinh bằng ui-ux-pro-max (`--design-system`, variance 4, motion 3, density 5) ngày 2026-10-16, sau đó **chỉnh lại để giữ brand hiện tại**.
Đã loại khỏi bản gốc: palette teal và font Baloo 2 / Comic Neue (skill khớp nhầm "giáo dục trẻ em"), GSAP (dự án không cài).

**Nguồn sự thật về token là `src/app/globals.css`.** File này chỉ mô tả cách dùng token. Khi hai nơi lệch nhau, `globals.css` đúng.

---

## 1. Đối tượng & giọng điệu

- Người học và người chia sẻ kiến thức IT (sinh viên, dev đi làm). Giao diện tiếng Việt.
- Chuyên nghiệp, rõ ràng, có cảm giác **tiến bộ** (gamification nhẹ), không trẻ con, không "AI purple gradient".

## 1b. Bối cảnh sản phẩm (tóm từ `de-xuat-do-an.md` — đọc file đó khi cần chi tiết nghiệp vụ)

- **Định vị:** nền tảng chia sẻ kiến thức IT. Ai cũng tạo được khoá free; bán khoá có phí cần xác minh hồ sơ. Mọi khoá đều qua kiểm duyệt.
- **Điểm khác biệt phải nổi bật trên UI:**
  1. Đánh giá năng lực tự động — quiz + bài code chấm trong sandbox (AC / WA / TLE / RE / CE, điểm theo số test).
  2. Hồ sơ năng lực theo topic (0–100%) → radar chart, badge kỹ năng.
  3. Gợi ý cá nhân hoá **có lý do** ("Gợi ý vì bạn đạt 35% ở React") — luôn hiển thị lý do cạnh gợi ý.
  4. Chứng chỉ có QR xác thực.
- **Tác nhân → nhóm giao diện:**

| Tác nhân | Giao diện | Việc chính của giao diện |
|---|---|---|
| Học viên | `(student)`, `(focus)` | Tìm khoá phù hợp năng lực → học → thấy mình tiến bộ |
| Giảng viên | `instructor/(dashboard)`, `instructor/(manage)` | Tạo khoá nhanh (free không cần xác minh) → gửi duyệt → hiểu học viên qua dashboard |
| Giảng viên đã xác minh | như trên + định giá, doanh thu | Đặt giá, theo dõi doanh thu/payout |
| Moderator, Admin | `admin/` (tài khoản nghiệp vụ, không có menu học) | Xử lý hàng đợi duyệt theo chủ đề nhanh và chính xác |

- **Trạng thái nghiệp vụ cần thiết kế rõ** (badge + giải thích + hành động tiếp theo):
  - Khoá: nháp → chờ duyệt → đã duyệt / bị từ chối (kèm lý do) → ẩn.
  - Xác minh giảng viên: chưa nộp → chờ duyệt → đã xác minh / bị từ chối (cho nộp lại).
  - Giá > 0 khi chưa xác minh: khoá lựa chọn + lời mời "Đăng ký bán khoá học", không báo lỗi khô.
- **Dashboard giảng viên** (mục 3.5 đề xuất): doanh thu, phễu chuyển đổi, giữ chân video, độ khó/độ phân biệt câu hỏi, heatmap topic yếu, học viên có nguy cơ bỏ học → mỗi biểu đồ kèm một câu kết luận và hành động gợi ý.

## 2. Màu (dùng class Tailwind theo token, không viết hex trong component)

| Vai trò | Token / class | Giá trị light |
|---|---|---|
| Primary (link, nút chính, ring) | `bg-primary`, `text-primary`, `hover:bg-primary-hover` | `#2563eb` |
| Nền nhấn nhẹ của primary | `var(--primary-light)` | `#eff6ff` |
| Brand accent — CTA mua/ghi danh, thành tựu | `bg-brand-accent` | `#f97316` |
| Nền / chữ | `bg-background`, `text-foreground` | `#ffffff` / `#0f172a` |
| Phụ | `bg-muted`, `text-muted-foreground` | `#f8fafc` / `#64748b` |
| Viền | `border-border` | `#e2e8f0` |
| Lỗi | `bg-destructive` | `#ef4444` |

> Lưu ý: class Tailwind `accent` là **nền hover trung tính** của shadcn, KHÔNG phải màu cam. Màu cam là `brand-accent`.

**Màu ngữ nghĩa có sẵn** (luôn đi kèm chữ/icon, không chỉ dựa vào màu):
- Độ thành thạo kỹ năng: `--skill-weak` / `--skill-mid` / `--skill-strong` (+ `-bg`)
- Kết quả chấm code: `--verdict-ac|wa|tle|re|ce|pending`
- Trạng thái khoá: `--status-draft|pending|approved|rejected|hidden`

Dark mode: class `.dark`, token đã định nghĩa sẵn — không hardcode màu sáng/tối riêng.

## 3. Chữ

- Body + heading: **Be Vietnam Pro** (`font-sans`, biến `--font-body`) — dấu tiếng Việt chuẩn.
- Code, số liệu kỹ thuật, ID: **JetBrains Mono** (`font-mono`).
- Body tối thiểu 16px (`text-base`), line-height ~1.5. Không dùng chữ < 12px.
- Thứ bậc: tiêu đề trang `text-2xl/3xl font-bold`, tiêu đề khối `text-lg font-semibold`, nhãn phụ `text-sm text-muted-foreground`.

## 4. Khoảng cách, bo góc, bóng

- Dùng thang spacing của Tailwind: 4 · 8 · 16 · 24 · 32 · 48 · 64px (`1 · 2 · 4 · 6 · 8 · 12 · 16`).
- Bo góc: `--radius: 8px` → `rounded-lg` cho card/nút, `rounded-xl` cho khối lớn.
- Bóng: `shadow-sm` cho card mặc định, `shadow-md` khi hover, `shadow-lg` cho popover/dialog. Không dùng bóng đậm.

## 5. Component

- Dùng component shadcn trong `src/components/ui/` (button, card, dialog, table, badge, progress, skeleton…). Không tạo lại kiểu nút/card riêng.
- Icon: **lucide-react** duy nhất. Không emoji làm icon. Nút chỉ có icon phải có `aria-label`.
- Biểu đồ: **recharts**, có legend + tooltip, màu theo token.
- Card khoá học có thể bấm: hover `shadow-md` + `-translate-y-0.5`, transition 200ms; không `scale` gây xô layout.

## 6. Hướng thiết kế lấy từ skill (phần còn thiếu của UI hiện tại)

**Tránh "UI chỉ hiện data":** mỗi màn phải có **một việc chính** và một CTA nổi bật nhất; số liệu đi kèm diễn giải ("Bạn yếu React Hooks — 35%") thay vì chỉ con số.

**Gamification nhẹ:**
- Progress bar / progress ring cho tiến độ khoá và độ thành thạo kỹ năng, animate khi giá trị đổi.
- Badge kỹ năng theo mức weak/mid/strong.
- Hiệu ứng "nhận chứng chỉ" khi hoàn thành khoá (fade + scale nhẹ, một lần).
- Mốc thành tích (hoàn thành chương, đạt quiz) báo bằng toast, không popup chặn.

**Pattern trang marketing** (trang chủ, `/teach`, chi tiết khoá):
Hero (CTA chính) → Vấn đề → Giải pháp/điểm khác biệt → Social proof (đánh giá thật: ảnh, tên, vai trò) → CTA lặp lại.
Nếu dùng carousel: có nút trước/sau và tạm dừng, dừng khi focus/hover/reduced-motion, điều khiển được bằng bàn phím.

## 7. Chuyển động

- Không dùng GSAP. Dùng CSS transition / `tw-animate-css` (`animate-in fade-in slide-in-from-bottom-2`).
- Hover/focus 150–200ms; xuất hiện nội dung 300ms, dịch chuyển ≤ 12px.
- Tôn trọng `prefers-reduced-motion` (`motion-safe:` / `motion-reduce:`).
- Nội dung cần cho SEO không được ẩn mặc định chờ JS.

## 8. Mật độ theo nhóm màn

| Nhóm | Mật độ | Ghi chú |
|---|---|---|
| Trang chủ, catalog, chi tiết khoá, `/teach` | thoáng | khoảng cách khối 48–64px |
| Học (video, quiz, code) — layout `(focus)` | vừa, ít phân tâm | không animation trang trí |
| Dashboard giảng viên, admin, moderator | dày | bảng/biểu đồ, khoảng cách 8–24px — xem `pages/dashboard.md` khi có |

## 9. Anti-patterns

- ❌ Màn chỉ là danh sách dữ liệu thô, không có việc chính / CTA / trạng thái rỗng có hướng dẫn
- ❌ Emoji làm icon; trộn bộ icon
- ❌ Hex cứng trong component; nhầm `accent` (trung tính) với `brand-accent` (cam)
- ❌ Chữ xám trên nền xám, tương phản < 4.5:1
- ❌ Bỏ focus ring; thiếu `cursor-pointer` trên phần tử bấm được
- ❌ Đổi trạng thái tức thì (0ms) hoặc animation dài, lặp vô hạn
- ❌ Chỉ dùng màu để phân biệt trạng thái (luôn kèm chữ/icon)

## 10. Pre-Delivery Checklist

- [ ] Mỗi màn có một việc chính + CTA rõ; có trạng thái loading (skeleton), rỗng, lỗi
- [ ] Chỉ dùng token/class theo mục 2; không hex cứng
- [ ] Icon lucide, có `aria-label` với nút chỉ icon
- [ ] `cursor-pointer` + hover 150–200ms trên phần tử bấm được
- [ ] Tương phản chữ ≥ 4.5:1 ở cả light và dark
- [ ] Focus ring thấy được khi dùng bàn phím
- [ ] `prefers-reduced-motion` được tôn trọng
- [ ] Responsive 375 / 768 / 1024 / 1440px, không cuộn ngang, không bị navbar che
