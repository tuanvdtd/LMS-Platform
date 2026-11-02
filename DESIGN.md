---
name: SkillPath
description: Nền tảng khoá học IT chấm bài tự động và gợi ý theo năng lực thực tế
colors:
  primary: "#2563eb"
  primary-hover: "#1d4ed8"
  primary-soft: "#eff6ff"
  brand-accent: "#f97316"
  brand-accent-strong: "#c2410c"
  brand-accent-soft: "#fff7ed"
  tertiary: "#7c3aed"
  tertiary-soft: "#f5f3ff"
  success: "#15803d"
  success-soft: "#f0fdf4"
  success-border: "#bbf7d0"
  warning: "#b45309"
  warning-soft: "#fffbeb"
  warning-border: "#fde68a"
  danger: "#b91c1c"
  danger-soft: "#fef2f2"
  danger-border: "#fecaca"
  destructive: "#ef4444"
  rating: "#f59e0b"
  skill-weak: "#ef4444"
  skill-mid: "#eab308"
  skill-strong: "#22c55e"
  ink: "#0f172a"
  ink-foreground: "#f8fafc"
  ink-muted: "#94a3b8"
  ink-border: "#334155"
  background: "#ffffff"
  foreground: "#0f172a"
  secondary: "#f1f5f9"
  secondary-foreground: "#334155"
  muted: "#f8fafc"
  muted-foreground: "#64748b"
  border: "#e2e8f0"
typography:
  display:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-accent:
    backgroundColor: "{colors.brand-accent}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "4px 10px"
    height: "36px"
  card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
  badge-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  ink-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-foreground}"
    height: "60px"
---

# Design System: SkillPath

## Overview

**Creative North Star: "The Transparent Scorecard"**

SkillPath là một bảng điểm minh bạch, không phải tủ kính bán khoá học. Thứ người dùng tìm đến là con số: học viên đạt bao nhiêu phần trăm ở topic nào, bài code Accepted mấy trên mấy test, khoá đang chờ duyệt hay đã bị từ chối và vì sao. Giao diện vì thế sáng, gọn, đặt số liệu và trạng thái lên trước. Màu chỉ mang nghĩa: xanh dương là hành động và đường đi, cam là điểm cần chú ý hoặc cần mua, còn xanh lá, vàng, đỏ luôn mang nghĩa đúng, đang học và yếu.

Cảm giác tổng thể mềm và thân thiện. Góc bo rõ, bóng đổ mềm có ngả màu mực, nền tint nhạt cho từng trạng thái. Học viên mới không thấy bị chấm điểm lạnh lùng. Mật độ thông tin theo kiểu Udemy: header có ô tìm kiếm lớn, card khoá học, trang khoá có cột giá dính. Phần thuộc về developer (code, thời lượng, kết quả chấm) dùng chữ mono.

Khi cần một dải nhấn mạnh (thanh quản lý khoá, hero trang khoá, thanh lưu nổi), hệ thống dùng một dải nền **ink** tối cố định ở cả hai theme. Không dùng gradient hay kính mờ để tạo điểm nhấn.

**Key Characteristics:**
- Số liệu và trạng thái đứng trước, luôn kèm chữ hoặc icon, không bao giờ chỉ có màu.
- Một màu hành động (xanh dương), một màu thúc đẩy (cam), ba màu đánh giá (xanh lá, vàng, đỏ).
- Mềm: card 14px, nút 8px, bóng có offset và ngả màu mực slate.
- Hai theme sáng/tối bằng token. Component không tự viết `dark:`.
- Giao diện tiếng Việt với Be Vietnam Pro. JetBrains Mono chỉ dùng cho code và dữ liệu đo được.

## Colors

Bảng màu tiết chế: neutral slate hơi ngả xanh, một màu chính, một màu nhấn, cộng một bộ màu ngữ nghĩa có đủ biến thể chữ / nền nhạt / viền.

### Primary
- **Xanh SkillPath** (primary): nút chính, link, tab đang chọn, thanh tiến độ, đường chính trong biểu đồ, logo. Ở theme tối đổi sang xanh sáng `#60a5fa` với chữ tối trên nền nút, để vừa làm nền nút vừa làm chữ đều đạt 4.5:1.
- **Xanh đậm khi hover** (primary-hover): chỉ dùng cho trạng thái hover/pressed của nút chính.
- **Xanh sương** (primary-soft): nền nhạt cho mục đang chọn, tin chưa đọc, chip topic, icon bài giảng.

### Secondary
- **Cam lộ trình** (brand-accent): CTA mua ("Thêm vào giỏ", "Mua ngay"), badge giảm giá, chấm "vừa chấm bài". Làm nền thì dùng chữ trắng ở cỡ đậm. Không dùng làm màu chữ thường.
- **Cam đất** (brand-accent-strong): khi màu cam phải làm chữ hoặc icon trên nền sáng (icon bài code, cảnh báo khoá).
- **Cam sữa** (brand-accent-soft): nền chip của nhóm cam.

### Tertiary
- **Tím quiz** (tertiary / tertiary-soft): loại nội dung quiz trong curriculum, verdict Runtime/Compile Error. Chỉ dùng để phân loại, không dùng cho hành động.

### Semantic
- **Đạt** (success / success-soft / success-border): Accepted, đã duyệt, đã hoàn thành, thanh toán thành công, chứng chỉ hợp lệ.
- **Đang chờ** (warning / warning-soft / warning-border): chờ duyệt, Time Limit, còn thiếu mục trong checklist, payout đang xử lý.
- **Lỗi** (danger / danger-soft / danger-border): Wrong Answer, bị từ chối, lỗi upload, nguy cơ bỏ học. `destructive` chỉ dùng cho nút xoá.
- **Thang năng lực** (skill-weak / skill-mid / skill-strong): chỉ dùng làm **màu tô** cho thanh và nút trên sơ đồ kỹ năng (< 40% / 40–70% / ≥ 70%). Nhãn chữ đi kèm dùng danger / warning / success.
- **Sao đánh giá** (rating): tô sao. Con số điểm cạnh sao dùng `warning`.

### Neutral
- **Giấy trắng** (background) và **mực slate** (foreground): nền và chữ chính.
- **Sương slate** (secondary / muted): nền phụ, hàng hover, placeholder ảnh bìa.
- **Chữ phụ** (muted-foreground): mô tả, meta, ngày giờ.
- **Đường kẻ** (border): mọi viền 1px.
- **Ink** (ink / ink-foreground / ink-muted / ink-border): dải nền tối cố định. Ở theme tối, ink tối hơn nền trang một bậc (`#020617`) để dải vẫn tách khỏi trang.

### Named Rules
**The Meaning-First Rule.** Màu ngữ nghĩa chỉ xuất hiện khi trạng thái đó có thật. Không dùng xanh lá để trang trí, không dùng đỏ để gây chú ý.

**The Paired-Signal Rule.** Mọi trạng thái màu đều có chữ hoặc icon đi kèm (✓ Accepted, đồng hồ cát Chờ duyệt). Người mù màu phải đọc được toàn bộ trạng thái.

**The Token-Only Rule.** Component không viết `bg-green-100`, `text-blue-600` hay mã hex. Màu nào chưa có token thì thêm token vào `globals.css`, kèm giá trị sáng và tối.

## Typography

**Display Font:** Be Vietnam Pro (với system-ui)
**Body Font:** Be Vietnam Pro (với system-ui)
**Label/Mono Font:** JetBrains Mono (với ui-monospace)

**Character:** Một họ chữ sans hình học có dấu tiếng Việt chuẩn, đi từ 300 đến 800. Mềm ở cỡ nhỏ, chắc ở cỡ tiêu đề đậm. Chữ mono là giọng của máy chấm: chỉ dùng cho code, thời lượng, số test và mã.

### Hierarchy
- **Display** (800, 3.25rem, 1.1): tiêu đề hero trang chủ và trang khoá. Mỗi màn hình tối đa một tiêu đề cỡ này.
- **Headline** (800, 1.875rem, 1.2): tiêu đề trang và tiêu đề section lớn ("Khám phá khoá học").
- **Title** (700, 1.125rem, 1.35): tiêu đề card, tên chương, tiêu đề panel.
- **Body** (400, 0.875rem, 1.5): chữ UI mặc định. Đoạn văn dài để đọc (mô tả khoá, đề bài) lên 1rem, rộng tối đa 70ch.
- **Label** (500, 0.75rem, 1.4): meta, badge, nhãn trục biểu đồ, chú thích.
- **Code** (JetBrains Mono 400, 0.8125rem): code, thời lượng `3:30`, `8/8 test`, `42 ms`, mã chứng chỉ.

### Named Rules
**The Machine-Voice Rule.** Mono chỉ dùng cho thứ máy sinh ra hoặc đo được. Không dùng mono để trang trí cho có vẻ "tech".

**The Balanced-Heading Rule.** h1–h3 tự cân dòng (`text-wrap: balance`). Tiêu đề không được để một chữ lẻ rơi xuống dòng cuối.

## Layout

Container nội dung rộng tối đa khoảng 1280px, căn giữa, lề hai bên 16px trên mobile. Trang học viên đi theo mobile trước: catalog và card dàn lưới 1 → 2 → 4 cột, carousel kéo ngang có snap. Dashboard giảng viên và admin đi theo desktop trước: sidebar trái cố định cộng vùng nội dung. Trang quản lý khoá có dải ink trên cùng và checklist bên phải. Trang khoá có cột giá dính bên phải trên desktop.

Nhịp khoảng cách theo bậc 4px. Trong một nhóm dùng 8–16px, giữa các khối 24–32px, giữa các section trang 64px. Khoảng trống phía trên tiêu đề luôn lớn hơn phía dưới. Section xen kẽ nền trắng và nền `muted` để chia nhịp thay vì kẻ đường.

## Elevation & Depth

Kết hợp hai cách: viền 1px `border` là lớp tách chính, bóng là lớp phụ và mềm. Bóng luôn có offset dọc và độ nhoè lớn, ngả màu mực slate (`rgb(15 23 42 / …)`), không dùng đen thuần, không phát sáng. Ở theme tối, việc tách lớp dựa vào bề mặt `card` sáng hơn nền và viền. Bóng gần như không thấy, và điều đó là cố ý.

### Shadow Vocabulary
- **Nghỉ** (`shadow-sm`: `0 1px 3px rgb(15 23 42 / .06), 0 1px 2px -1px rgb(15 23 42 / .04)`): card ở trạng thái thường.
- **Nâng** (`shadow-md`: `0 6px 16px -4px rgb(15 23 42 / .10), 0 2px 4px -2px rgb(15 23 42 / .05)`): card khoá học khi hover, kèm nhích lên 2px.
- **Nổi** (`shadow-lg`: `0 14px 32px -8px rgb(15 23 42 / .14), 0 4px 8px -4px rgb(15 23 42 / .06)`): popover, dropdown, card minh hoạ trên hero.
- **Lơ lửng** (`shadow-xl`: `0 24px 48px -12px rgb(15 23 42 / .22), 0 8px 16px -8px rgb(15 23 42 / .08)`): thanh lưu nổi, dialog.

### Named Rules
**The Lift-On-Intent Rule.** Bề mặt phẳng khi nghỉ. Bóng đậm hơn chỉ xuất hiện khi người dùng trỏ vào hoặc khi lớp đó thật sự nằm trên lớp khác (popover, dialog, thanh lưu).

## Shapes

Góc bo mềm, đọc như đồ vật thân thiện, không tròn như đồ chơi. Thang bo dựa trên `--radius: 10px`:
- **6px** (`rounded-sm`): chip nhỏ trong bảng, ô heatmap.
- **8px** (`rounded-md`): nút, ô nhập, select, mục menu.
- **10px** (`rounded-lg`): ô trong form lớn, khung code, alert.
- **14px** (`rounded-xl`): card, panel, thanh lưu.
- **18px** (`rounded-2xl`): khối lớn (card minh hoạ hero, khối kêu gọi dạy học).
- **Tròn** (`rounded-full`): badge trạng thái, avatar, chấm thông báo, bước số.

Ảnh bìa khoá học luôn có tỉ lệ 16:9 và bị cắt theo góc card.

## Components

### Buttons
Chắc tay nhưng mềm: cao 36px, bo 8px, chữ semibold 14px. Khi bấm, nút nhích xuống 1px.
- **Shape:** bo 8px (`rounded-md`). Cỡ `lg` cao 44px cho CTA chính trên hero và trang khoá.
- **Primary:** nền xanh SkillPath, chữ trắng. Hover sang xanh đậm.
- **Accent:** nền cam, chữ trắng đậm. Chỉ dùng cho hành động mua, mỗi màn tối đa một nút.
- **Outline / Secondary / Ghost:** nền trắng có viền, nền slate nhạt, hoặc trong suốt. Hover dùng nền `secondary`.
- **Destructive:** nền đỏ 10% với chữ `danger`, không dùng nền đỏ đặc.
- **Focus:** viền `ring` cộng quầng 3px `ring/50`.

### Chips / Badges
- **Style:** tròn, nền `*-soft`, chữ màu gốc của tông, 12px semibold, padding 2px × 10px.
- **State:** Nháp (`secondary`), Chờ duyệt (`warning`), Đã duyệt / Đang bán (`success`), Bị từ chối (`danger`), Đã ẩn (`secondary`, chữ slate đậm).

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** `card` (trắng ở theme sáng, slate-800 ở theme tối).
- **Shadow Strategy:** nghỉ ở `shadow-sm`. Card bấm được dùng utility `card-interactive` (`globals.css`): hover **và** focus bàn phím cùng nhấc 2px, bóng lên `shadow-md`, viền đậm lên thành `foreground` 16% (trung tính), nền chuyển `--card-hover` (sáng hơn một bậc ở theme tối, nơi bóng gần như không thấy). Focus có thêm quầng ring 3px.
- **Border:** 1px `border`. Không bao giờ đổi viền sang xanh khi hover.
- **Một tín hiệu xanh:** khi hover, chỉ CTA/mũi tên ("Xem chi tiết →", mũi tên ↗) phản hồi bằng màu hoặc nhích sang phải. Tiêu đề giữ màu chữ thường.
- **Carousel:** khung cuộn ngang (`overflow-x-auto`) cắt cả chiều dọc, nên phải chừa `pt-3 pb-5` + `px-3` rồi bù bằng margin âm, để card nhấc lên và bóng không bị che.
- **Dữ liệu trống:** ẩn mục meta bằng 0 (số bài, thời lượng, học viên). Khoá chưa có đánh giá hiện chip "Khoá mới". Phụ đề luôn giữ chỗ 2 dòng để card cùng hàng thẳng nhau. Ảnh bìa trống dùng nền `muted` + icon.
- **Internal Padding:** 16px cho card khoá học, 20–24px cho panel dashboard.

### Inputs / Fields
- **Style:** viền 1px `input`, nền trong suốt, bo 8px, cao 36px. Ô tìm kiếm ở header bo tròn hẳn.
- **Focus:** viền đổi sang `ring` cộng quầng 3px `ring/50`. Con trỏ nhập liệu màu primary.
- **Error / Disabled:** viền `destructive` và quầng đỏ 20%. Disabled giảm opacity 50%.

### Navigation
- **Header học viên:** nền trắng, logo bên trái, menu "Khám phá", ô tìm kiếm lớn ở giữa, bên phải là Dạy học / theme / giỏ hàng / tài khoản. Trên mobile, ô tìm kiếm thu lại thành icon.
- **Sidebar giảng viên:** mục 14px, mục đang chọn nền `primary-soft` chữ `primary`.
- **Dải ink quản lý khoá:** cao 60px, nền ink, chữ `ink-foreground`, nút viền `ink-border`, hover `ink-hover`.
- **Tab:** gạch chân 2px màu foreground dưới tab đang chọn.

### Skill Bar (signature)
Thanh năng lực là chữ ký của hệ thống. Bên trái là tên topic, bên phải là `35% · Yếu`. Bên dưới là thanh cao 8px bo tròn, nền `secondary`, phần đã đạt tô bằng `skill-weak` / `skill-mid` / `skill-strong`. Lý do gợi ý đặt ngay dưới thanh, trong một khối nền `muted`, mở đầu bằng "Gợi ý vì bạn đạt …".

### Verdict Line (signature)
Kết quả chấm code luôn có dạng icon + tên verdict + số test + thời gian chạy, ví dụ `✓ Accepted · 5/5 test · 42 ms`. Phần số viết bằng mono. Accepted dùng `success`, Wrong Answer dùng `danger`, Time Limit dùng `warning`, Runtime/Compile Error dùng `tertiary`, đang chấm dùng `muted-foreground`.

## Do's and Don'ts

### Do:
- **Do** dùng token ngữ nghĩa (`text-success`, `bg-warning-soft`, `border-danger-border`, `bg-ink`) cho mọi màu trạng thái.
- **Do** để badge trạng thái có chữ, và kèm icon khi đứng một mình.
- **Do** dùng `bg-primary text-primary-foreground` khi đặt chữ lên nền màu chính, để theme tối tự đổi sang chữ tối.
- **Do** dùng `card-interactive` cho mọi thẻ bấm được (card khoá học, ô danh mục), thay vì tự viết lại hover/focus.
- **Do** viết số liệu đo được (thời lượng, số test, ms, mã) bằng JetBrains Mono.
- **Do** thêm token mới vào `globals.css` theo cặp sáng / tối khi cần màu mới.

### Don't:
- **Don't** dùng class màu Tailwind thô (`bg-green-100`, `text-blue-600`) hay mã hex trong component. Biểu đồ Recharts là ngoại lệ duy nhất, vì thuộc tính SVG không đọc được biến CSS.
- **Don't** viết `dark:` để đổi màu trong component. Theme tối đến từ token.
- **Don't** dùng màu thang năng lực (`skill-*`) làm màu chữ, vì không đạt 4.5:1 trên nền trắng.
- **Don't** đặt nhãn kicker / eyebrow nhỏ viết hoa phía trên tiêu đề. Tiêu đề tự đủ sức nặng.
- **Don't** dùng gradient chữ, kính mờ trang trí, viền màu dày bên trái card, hay bóng cứng không nhoè.
- **Don't** dùng hai nút cam trên một màn hình.
- **Don't** đổi viền card sang xanh khi hover. Viền `primary` là ngôn ngữ "đã chọn" (đáp án quiz, bộ lọc đang áp).
- **Don't** hiện % thành thạo topic suy ra từ quiz hay bài code trong khoá. Năng lực chỉ đến từ bài đánh giá kỹ năng của nền tảng.
