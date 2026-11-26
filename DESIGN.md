---
name: Aolumi
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
  secondary: "#eef3fa"
  secondary-foreground: "#334155"
  muted: "#f6f8fc"
  muted-foreground: "#586a82"
  ui-accent: "#eaf1fe"
  ui-accent-foreground: "#1e40af"
  tone-blue: "#1d4ed8"
  tone-blue-soft: "#e6eefe"
  tone-violet: "#6d28d9"
  tone-violet-soft: "#f0eafe"
  tone-teal: "#0f766e"
  tone-teal-soft: "#e0f5f2"
  tone-rose: "#be123c"
  tone-rose-soft: "#fde9ee"
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
    backgroundColor: "{colors.muted}"
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

# Design System: Aolumi

## Overview

**Creative North Star: "The Transparent Scorecard"**

Aolumi là một bảng điểm minh bạch, không phải tủ kính bán khoá học. Thứ người dùng tìm đến là con số: học viên đạt bao nhiêu phần trăm ở topic nào, bài code Accepted mấy trên mấy test, khoá đang chờ duyệt hay đã bị từ chối và vì sao. Giao diện vì thế sáng, gọn, đặt số liệu và trạng thái lên trước. Màu chỉ mang nghĩa: xanh dương là hành động và đường đi, cam là điểm cần chú ý hoặc cần mua, còn xanh lá, vàng, đỏ luôn mang nghĩa đúng, đang học và yếu.

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
- **Xanh Aolumi** (primary): nút chính, link, tab đang chọn, thanh tiến độ, đường chính trong biểu đồ, logo. Ở theme tối đổi sang xanh sáng `#60a5fa` với chữ tối trên nền nút, để vừa làm nền nút vừa làm chữ đều đạt 4.5:1.
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
- **Sương slate** (secondary / muted): nền phụ, nền ô nhập, đầu bảng. Ngả nhẹ về hue xanh thương hiệu để nền phụ không thành xám chết.
- **Xanh hover** (ui-accent / ui-accent-foreground, class `bg-accent`): mục đang trỏ trong menu, select, gợi ý tìm kiếm.
- **Chữ phụ** (muted-foreground): mô tả, meta, ngày giờ.
- **Đường kẻ** (border): mọi viền 1px.
- **Ink** (ink / ink-foreground / ink-muted / ink-border): dải nền tối cố định. Ở theme tối, ink tối hơn nền trang một bậc (`#020617`) để dải vẫn tách khỏi trang.

### Category Tones
- **Tông lĩnh vực** (tone-blue / violet / teal / rose, mỗi màu có `-soft`): icon và ô icon của danh mục cấp 1 (`categoryTone()` trong `category-icon.tsx`): Phát triển xanh, Trí tuệ nhân tạo tím, CNTT & Phần mềm xanh ngọc, Thiết kế hồng. Chỉ để nhận ra lĩnh vực, không mang nghĩa trạng thái, nên cố ý tránh xanh lá / vàng / đỏ.
- **Bìa trống** (`cover-placeholder` trong `globals.css`): khoá chưa có ảnh bìa dùng nền `primary-soft` + lưới chấm, icon `text-primary/70`. Không dùng ô xám.

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
- **Nút đặc** (`shadow-brand`, `shadow-buy`): nút primary / accent có bóng ngả đúng màu nút cộng vệt sáng 1px ở mép trên, hover sâu hơn (`shadow-brand-hover`), bấm thì mất bóng. Theme tối thay bằng bóng tối trung tính.
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
- **Primary:** nền xanh Aolumi, chữ trắng, bóng `shadow-brand`. Hover sang xanh đậm và bóng sâu hơn.
- **Accent:** nền cam, chữ trắng đậm, bóng `shadow-buy`. Chỉ dùng cho hành động mua, mỗi màn tối đa một nút.
- **Outline:** nền trắng, viền, bóng `shadow-xs`. Hover chuyển nền `primary-soft`, chữ `primary`, viền `primary/30`.
- **Secondary / Ghost:** nền slate nhạt hoặc trong suốt. Hover dùng nền `secondary`.
- **Destructive:** nền đỏ 10% với chữ `danger`, không dùng nền đỏ đặc.
- **Focus:** viền `ring` cộng quầng 3px `ring/50`.

### Chips / Badges
- **Style:** tròn, nền `*-soft`, chữ màu gốc của tông, 12px semibold, padding 2px × 10px.
- **Variants của `<Badge>`:** `info`, `success`, `warning`, `danger`, `accent`, `tertiary`: nền `*-soft`, viền 1px cùng tông, chữ màu gốc. Dùng variant thay vì tự viết class màu.
- **State:** Nháp (`secondary`), Chờ duyệt (`warning`), Đã duyệt / Đang bán (`success`), Bị từ chối (`danger`), Đã ẩn (`secondary`, chữ slate đậm).
- **Alert:** mặc định là thông tin (nền `primary-soft`, icon `primary`); thêm `warning`, `success`, `destructive` (nền `danger-soft`).

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
- **Style:** viền 1px `input`, nền `muted` có bóng trong rất nhẹ, bo 8px, cao 36px (select cũng 36px). Hover viền đậm lên một bậc. Ô tìm kiếm ở header bo tròn hẳn.
- **Focus:** nền chuyển trắng, viền đổi sang `ring` cộng quầng 3px `ring/50`. Con trỏ nhập liệu màu primary. Select đang mở giữ trạng thái này.
- **Menu / Select / Dialog:** mục đang trỏ nền `ui-accent` chữ xanh đậm. Popup dùng `shadow-lg`. Lớp phủ dialog là `ink/45`, không blur; hộp thoại `shadow-xl`, tiêu đề 18px đậm.
- **Error / Disabled:** viền `destructive` và quầng đỏ 20%. Disabled giảm opacity 50%.

### Navigation
- **Header học viên:** nền trắng, logo bên trái, rồi nhóm xem nội dung "Khám phá" và "Blog", ô tìm kiếm lớn ở giữa, bên phải là Dạy học / theme / giỏ hàng / tài khoản. Trên mobile, ô tìm kiếm thu lại thành icon.
- **Sidebar giảng viên:** mục 14px, mục đang chọn nền `primary-soft` chữ `primary`.
- **Dải ink quản lý khoá:** cao 60px, nền ink, chữ `ink-foreground`, nút viền `ink-border`, hover `ink-hover`.
- **Khung học (trang learn):** header ink (`bg-ink`) cao 56px, nối với dải tiến độ ink ở đầu mục lục thành hình chữ L. Sếp chọn bản ink này sau khi xem 3 bản preview (header trắng bị chê nhạt). Khi mục lục đang hiện, header chia 2 cột thẳng với layout: nhóm trái (nút mục lục, logo) rộng bằng mục lục, viền phải nối liền viền mục lục; tên khoá thẳng hàng với tên bài. Bên phải header: chip tiến độ (chỉ khi mục lục không trên màn), link "Học tập của tôi", và "Bài tiếp" trên trang quiz/code. Mọi mục bấm được trên header cao 44px, chữ `ink-foreground`, hover `ink-hover`, viền `ink-border`. Nội dung các tab (Tổng quan, Ghi chú, Hỏi đáp) đặt thẳng trên nền trang, không đóng khung card. Sếp đã thử khung card + nền canvas và thấy xấu. Mục lục bên trái rộng 352px (lg) / 384px (xl). Thu gọn/mở mục lục có trượt 300ms ease-out (`cubic-bezier(0.16,1,0.3,1)`): cột co giãn bề rộng, nội dung bên trong trượt bằng translate, nhóm trái của header co cùng nhịp. Có tôn trọng reduced-motion, và cột chuyển `inert` khi thu gọn. Đầu mục lục là dải tiến độ nền ink, có số % lớn màu primary và thanh tiến độ rãnh `ink-hover`. Mở một chương thì chương hiện ngay (không giãn chiều cao), rồi khung mục lục cuộn mượt để tiêu đề chương lên sát mép trên, giống Udemy, nên mọi bài của chương đều lọt khung nhìn. Chương cuối thì cuộn hết cỡ. Icon loại bài trong mục lục tô màu theo loại: bài giảng primary, quiz tertiary, bài code cam đất. Dưới video là dải bài học: tên bài, dòng "Phần · Bài · thời lượng" kèm chip trạng thái ("Xem đủ 90% để hoàn thành" / "✓ Đã hoàn thành"), bên phải chỉ có nút "Bài tiếp" (không có "Bài trước", quay lại thì dùng mục lục). Thanh tab gạch chân dính dưới header. Trang quiz và bài code đặt nút "Bài tiếp" trên header. Hết video thì hiện lớp phủ ink "Bài tiếp", chỉ chuyển khi người học bấm. Bấm chuột rồi nhấn phím không vẽ viền focus (`usePointerFocus`); Tab thì viền hiện lại.
- **Khung quản trị (admin / moderator):** header trắng 56px (logo, chip ink "Quản trị"/"Kiểm duyệt", menu tài khoản). Sidebar trái 256px chia nhóm (Hàng đợi duyệt · Vận hành · Hệ thống), mục đang chọn nền `primary-soft` chữ `primary`, số việc đang chờ hiện bằng chip `warning-soft`. Trên mobile sidebar thành ngăn trượt. Nội dung đặt trên nền `muted`, rộng tối đa 1152px. Hàng đợi là card có tab gạch chân kèm số lượng, mỗi dòng là một link, chip "Chờ x ngày" chuyển sang tông cảnh báo khi chờ ≥ 3 ngày. Trang chi tiết có header của bài nộp, cột trái là nội dung, cột phải là "Quyết định" dính gồm giá, ghi chú, **Kiểm tra tự động** (✓/⚠ kèm chữ) và nút Duyệt/Từ chối. Hộp từ chối có lý do soạn sẵn dạng bật/tắt. Sau khi ra quyết định có nút "Sang mục chờ tiếp theo".
- **Khu soạn khoá (instructor manage):** tiêu đề trang cách nội dung 32px, các card cách nhau 20px. Mỗi nhóm là một card có tiêu đề (kể cả card đầu); card chỉ có nội dung vẫn có padding 24px ở mép trên. Form có nút gửi đặt ở chân card (nền `muted`, viền trên, nút căn phải). Bảng nằm trong card, bảng rỗng hiện trạng thái trống có icon. Trong khung chương trình, nhãn "Bài giảng 3" / "Phần 2" nằm trên tên để tên mọi dòng thẳng một cột; nút thao tác của dòng rộng cố định 120px.
- **Tab:** gạch chân 2px màu `primary` dưới tab đang chọn, chữ tab chọn đậm và giữ màu chữ thường. Kiểu pill: tab chọn nền trắng chữ `primary`.

### Skill Bar (signature)
Thanh năng lực là chữ ký của hệ thống. Bên trái là tên topic, bên phải là `35% · Yếu`. Bên dưới là thanh cao 8px bo tròn, nền `secondary`, phần đã đạt tô bằng `skill-weak` / `skill-mid` / `skill-strong`. Lý do gợi ý đặt ngay dưới thanh, trong một khối nền `muted`, mở đầu bằng "Gợi ý vì bạn đạt …".

### Verdict Line (signature)
Kết quả chấm code luôn có dạng icon + tên verdict + số test + thời gian chạy, ví dụ `✓ Accepted · 5/5 test · 42 ms`. Phần số viết bằng mono. Accepted dùng `success`, Wrong Answer dùng `danger`, Time Limit dùng `warning`, Runtime/Compile Error dùng `tertiary`, đang chấm dùng `muted-foreground`.

## Guest Home (trang chủ khách)

- **Mạch:** hero (định vị: nền tảng chia sẻ khoá học + tự học; thẻ "Ví dụ" gồm khoá do giảng viên chia sẻ đã duyệt và tiến độ của người học) → nỗi đau người tự học → 2 điểm khác biệt, mỗi điểm một mảnh giao diện có nhãn "Ví dụ" (máy chấm code, bài đánh giá 12 câu) → lĩnh vực → khoá nổi bật → giảng viên + kiểm duyệt → hỏi đáp → CTA. Nền xen kẽ trắng / sương. Hero là dải ink phẳng (không blob, không quầng sáng; nút trên nền ink tắt bóng màu). CTA cuối là panel xanh sương trên nền trắng (không dùng ink để khỏi dính vào footer tối): trái là lời kêu gọi + nút, phải là thẻ "3 bước để bắt đầu" có thời gian từng bước.
- **Mascot Lumi:** chữ "a" của logo được thổi khối: bát tròn + đuôi bong bóng + thanh dọc, chuyển sắc xanh Aolumi có vệt bóng. Lỗ chữ "a" phát sáng làm mặt ("lumi" là ánh sáng), mắt to có tròng xanh và đốm sáng, lông mày, má hồng. Tay 2 khúc (vai, khuỷu, bàn tay tròn), chân ngắn đặt đối xứng dưới bát. Đứng yên vẫn đọc ra chữ "a". Màu cố định như một hình minh hoạ, không đổi theo theme. Sếp chốt hướng "có khối" sau khi chê bản logo gắn mặt; học phong cách Gendemy nhưng không bắt chước nhân vật của nền tảng khác.
- **Rive:** minh hoạ động nằm trong `public/rive/guest-home.riv` (artboard `Lumi`, `Study`, `Teach`, `Ask`; state machine trùng tên artboard) `public/rive/celebrate.riv` (artboard `Graduate` và `Confetti`, xem Chúc mừng hoàn thành khoá) và `public/rive/lumi.riv` (artboard `Coder`, `Examiner`, xem Lumi phản ứng kết quả; `Lost`, `Guard`, `Fixer`, xem Trang lỗi). Nguồn là `it-course-platform/rive/*.mjs`, build bằng `node rive/build.mjs` qua rive-mcp-server. Không xuất từ Rive Editor gói Free vì file kèm màn splash che hình 1–2s. Runtime `@rive-app/react-canvas-lite`, wasm tự host (postinstall copy vào `public/rive/`). Runtime canvas không vẽ feather, nên vùng mờ dùng chuyển sắc trong suốt.
- **Hero:** Lumi (`GuestLumi`) đứng trên mép thẻ "Ví dụ", ô giữ sẵn kích thước nên không xô layout. Lumi thở, chớp mắt không đều, mắt và mặt nhìn theo con trỏ (input `lookX`/`lookY`). Rê chuột thì cười vẫy tay, bấm thì nhảy mừng. Tự nhảy mừng lúc chip "Accepted" hiện.
- **Cảnh minh hoạ (`GuestScene`):** sân khấu xanh đêm bo 28px (`--illus-stage`, giống nhau ở 2 theme), khung 4:3. Tự học: gõ code ban đêm, dấu "?" hoá dấu tích. Giảng viên: chỉ từng dòng khung chương trình, dòng cuối từ chờ duyệt sang đã duyệt. Hỏi đáp: soi câu hỏi bằng kính lúp. Mỗi vòng lặp bắt đầu từ trạng thái đầy đủ.
- **Chuyển động:** HTML dùng thư viện `motion` với `MotionConfig reducedMotion="user"`. Thanh năng lực hero chạy từ 0 khi tải. Khối dưới màn đầu hiện dần một lần (lên 24px, 0,7s, expo-out), danh sách so le 90ms. Máy chấm minh hoạ chạy từng test khi lọt màn hình. Rive tự dừng vẽ khi ra khỏi màn hình. Giảm chuyển động thì Rive không autoplay (đứng ở khung đầu) và Lumi không theo chuột.
- **Chúc mừng hoàn thành khoá (`CertificateDialog`):** học xong bài cuối thì phủ toàn màn hình một lớp ink 95% (không làm mờ phía sau; sếp chọn kiểu "tối nền" thay cho hộp thoại sau khi so với Gendemy). Nội dung đặt thẳng trên nền, không đóng khung, nhưng vẫn là dialog: giữ focus bên trong, Esc để đóng, nút X ở góc màn hình. Bước 1: pháo giấy `Confetti` phủ kín màn hình (Fit.Cover) phía sau, ở giữa là Lumi `Graduate` (nền trong suốt, quầng sáng + quạt tia vàng sau lưng, đội mũ tốt nghiệp, cầm cuộn bằng), tiêu đề trắng, tên khoá một dòng riêng, nút "Xem chứng chỉ" (focus sẵn). Bước 2: ảnh chứng chỉ trên nền tối, nút viền kiểu nền ink + nút Tải PDF; ảnh được tải trước từ bước 1 để không hiện ô chờ. `burst` chạy một lần (nhảy mừng, tia sáng bung, pháo bắn chéo từ 2 góc dưới) rồi sang `loop` (vẫy tay, giấy rơi kiểu mưa: cột và pha ngẫu nhiên độc lập, không xếp chéo). Mở 300ms, đóng 150ms. Giảm chuyển động thì chỉ dựng khung đầu của `loop`. Cả 2 bước vừa một màn hình laptop 674px.
- **Lumi phản ứng kết quả (`lumi-moment.tsx`):** mỗi màn Lumi một vai riêng (trang phục, đạo cụ, cử chỉ), không lặp vai đã có. Lumi nhỏ, `aria-hidden`, đứng cạnh kết quả; số liệu vẫn do HTML hiện. State machine có input `mood`: -1 chưa có gì, n chạy phản ứng một lần rồi đứng ở tư thế cuối, 10+n vào thẳng tư thế cuối. Tư thế cuối chỉ thở và chớp mắt, không lặp cử chỉ. Giảm chuyển động thì vào thẳng tư thế cuối rồi dừng vẽ. Tải bằng `next/dynamic`.
  - `Coder`, kết quả chấm code: tai nghe có mic, cạnh cửa sổ terminal. Lumi nằm bên phải khối "Đang chấm…" / tóm tắt bài nộp, chỉ hiện khi khung kết quả rộng từ `@lg`. Đang chấm thì 3 ô test sáng lần lượt, Lumi gõ nhịp chờ. Accepted thì terminal hiện ✓, Lumi nhảy giơ 2 tay. Chưa đạt thì terminal hiện ✗, một con bọ bò ra, Lumi gãi đầu. Chỉ phản ứng khi kết quả vừa chấm xong; mở bài nộp cũ thì đứng sẵn ở tư thế cuối. Lỗi của hệ thống chấm thì không hiện Lumi.
  - `Examiner`, kết quả bài đánh giá kỹ năng: kính tròn, bảng kẹp. Lumi đứng trên đỉnh một ngọn núi cao theo % năng lực, đặt ở đầu khối kết quả. Cảnh có mây nhạt trôi, dải đất, thông và đá dưới chân núi, đường mòn zigzag trên sườn; không có vạch chia. Sếp chê thước đo dọc giống nhiệt kế và chọn núi thay cho bậc thang. Input `level` 0–100 điều khiển chiều cao núi. Input `peak` cho mức Vững (level ≥ 70): 0 là chưa tới; 1 là núi vừa trồi qua 70%, khi đó tuyết phủ dần và cờ chữ "a" của Aolumi rơi xuống cắm cạnh Lumi; 2 là đã ở Vững từ trước, cờ cắm sẵn. Tụt khỏi Vững thì tuyết và cờ mờ đi. Trang tween level 1s cùng lúc với đoạn đầu của phản ứng. Lần đầu: núi trồi từ mặt đất, kính loé, giơ bảng kẹp. Tăng: núi trồi lên, Lumi nhún giữ thăng bằng rồi giật nắm tay, sao bung. Giảm: núi lún xuống, vài viên đá lăn xuống sườn, Lumi tròn mắt chúi chao đảo, rồi nhíu mày gồng tay "cố lên". Không đổi: kính loé, gật đầu. Blend 1D của Rive trộn từ giá trị khung trước nên lệch phi tuyến; vì vậy có một lớp đặt núi về 0% mỗi khung trước lớp blend.
- **Trang lỗi (404 / 403 / 500, `ErrorScreen`):** một trục căn giữa, không card, không bảng chi tiết: cảnh Lumi nền trong suốt khung 18:11 (rộng tối đa 380px) ở trên, dưới là tiêu đề 24px đậm, một câu nói vì sao và làm gì tiếp, hàng nút căn giữa (nút đặc trước; dưới `sm` rộng hết và xếp dọc). Chỉ 404 có dòng mã "404" nhỏ mờ trên tiêu đề. Dòng chân nhỏ dưới nút: 403 ghi "Bạn đang đăng nhập bằng …" (email là một khối, không bẻ sau `@`) và link "Đổi tài khoản" dòng riêng; 500 ghi mã lỗi (digest) bằng mono kèm nút sao chép, chỉ khi có mã. Lời 500 trung tính, không đổ lỗi cho ai: "Trang này tạm thời chưa tải được. Bạn thử tải lại, hoặc quay lại sau ít phút." 404 và 500 của trang học viên nằm trong header/footer của site; 500 cấp root và 403 cho người không phải nhân sự đứng riêng, có logo căn giữa ở trên. Sếp chọn bố cục này trong 3 phương án (căn giữa / sân khấu ink / số lớn làm nền), sau khi chê bản hai cột có dải "Mã lỗi / Đường dẫn". Lumi diễn một lần (`mood` 0) rồi đứng ở tư thế cuối, chỉ cảnh vật còn chuyển động nhẹ; giảm chuyển động thì vào thẳng tư thế cuối.
  - `Lost`, 404: cầm bản đồ lộn ngược cạnh cột biển chỉ đường, nhìn biển rồi nhìn bản đồ, xoay bản đồ lại, nhún vai, dấu "?" cam nổi trên đầu.
  - `Guard`, 403: mũ bảo vệ có huy hiệu chữ "a", cạnh thanh barie sọc cam có đèn nhấp nháy và biển ổ khoá. Barie hạ xuống, Lumi giơ tay ra hiệu dừng và lắc đầu, rồi chỉ sang trái về phía nút. Người không phải nhân sự có nút về trang chủ; moderator vào trang chỉ admin thì có nút về hàng đợi duyệt khoá. Cả hai có "Đổi tài khoản" vì tài khoản quản trị được cấp riêng.
  - `Fixer`, 500: mũ bảo hộ vàng, cờ lê, cạnh tủ máy chủ bung cửa, lộ dây, đèn đỏ nháy, khói bốc. Lumi giật mình, quay sang vặn cờ lê (toé lửa), rồi giơ cờ lê quyết tâm. Không có cử chỉ "đã sửa xong" vì lỗi chưa được xử lý. `app/error.tsx` (không header), `(student)/error.tsx` (giữ header/footer) và `global-error.tsx` (tự nạp CSS, font, theme) dùng chung `ServerErrorContent`.
- **Ảnh tìm trên web:** chỉ giấy phép CC0 / PD / CC BY, ghi nguồn nhỏ ngay dưới khối dùng ảnh. Hiện trang không dùng ảnh web nào.

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
