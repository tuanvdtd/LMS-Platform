# Menu "Khám phá" kiểu Udemy, header responsive, cacheComponents

- Ngày: 2026-09-30
- Phạm vi: `back-end/` (bảng `category_topics`, API cây danh mục), `it-course-platform/` (header, mega menu, drawer mobile, axios, cacheComponents, loading skeleton)
- Liên quan: `2026-09-29-udemy-taxonomy-topics-design.md` (D4 bị thay thế, §5 bị thay thế)
- Tham chiếu UI: menu "Khám phá" của udemy.com (vi), xem ngày 2026-09-30

## 1. Mục tiêu

Thay dropdown 6 "track" hard-code trong header bằng menu 3 cấp giống Udemy, dữ liệu lấy từ DB:
**Category cấp 1 → Category cấp 2 → Các chủ đề phổ biến (topic)**. Header responsive như Udemy.
Đưa axios vào FE làm client chuẩn cho API nghiệp vụ, bật `cacheComponents` của Next 16.

**Trong phạm vi**

- Bảng `category_topics` + seed topic phổ biến cho mọi category cấp 2
- `GET /api/categories/tree` (public)
- Mega menu desktop 3 cột, drawer mobile đi sâu từng cấp, header responsive
- `src/lib/api/client.ts` (axios) cho các feature sau
- `cacheComponents: true`, `loading.tsx` + skeleton cho mọi route group, `next build` sạch
- Đổi route chi tiết khoá `/courses/[slug]` → `/course/[slug]` (E8)

**Ngoài phạm vi**

- Trang danh sách khoá theo category/topic: link trỏ tới route mới (`/courses/...`, `/topic/...`), tạm 404
- Khối "Khám phá theo mục tiêu" (Học AI, Luyện thi chứng chỉ)
- Admin sửa `category_topics` (chỉ seed)
- Xoá/đổi route cũ `categories/[track]` (không đụng `/courses/...` nên không va chạm)

## 2. Quyết định

| # | Quyết định | Lý do |
|---|---|---|
| E1 | Topic của cột 3 lấy từ **bảng curated `category_topics`**, **thay D4** của spec taxonomy (tính từ khoá đã duyệt) | Chưa có khoá nào → theo D4 menu trống. Curated có dữ liệu ngay, admin xếp thứ tự được |
| E2 | Chỉ làm menu, **không** làm trang đích | Trang danh sách khoá cần API khoá học, để feature riêng |
| E3 | Server Component fetch cây danh mục bằng `fetch` + `'use cache'`, **không** dùng axios cho menu | Menu có trong static shell, không nháy loading, không tốn request client. Next chỉ cache được `fetch`/hàm `'use cache'` |
| E4 | axios cho API nghiệp vụ gọi từ client, `withCredentials: true`; **không** dùng axios cho `/api/auth/*` | `authClient` của Better Auth đã lo auth. Cookie session đi kèm nhờ `withCredentials`, BE đã bật CORS `credentials: true` |
| E5 | Bật `cacheComponents` ngay trong feature này | FE còn toàn mock, chưa có page nào dựa vào cache kiểu cũ → chuyển bây giờ rẻ nhất |
| E6 | Popover/Sheet của shadcn cho khung, **3 cột tự viết bằng Tailwind** | shadcn không có cascading panel: `NavigationMenu`/`DropdownMenuSub` mở popup rời, không ghép cột liền nhau |
| E7 | Bố cục theo Udemy, **màu theo token SkillPath** (`--primary`) | Giữ nhận diện của app |
| E8 | **Đổi route chi tiết khoá `/courses/[slug]` → `/course/[slug]`** như Udemy; `/courses/...` dành cho danh mục | Không đổi thì `/courses/development` mở trang chi tiết khoá (page hiện tại không `notFound()`), và slug category với slug khoá sẽ tranh nhau cùng một path. Chỉ ~6 chỗ link |
| E9 | Header lấy dữ liệu qua **Server Component `SiteHeader`** dùng ở cả 5 chỗ đang render `<Header>` | Header có ở `(student)`, `(cartless)`, `(focus)`, `instructor` layout và `not-found.tsx`. Một wrapper thay vì lặp fetch ở 5 nơi |
| E10 | Lỗi khi lấy cây danh mục: trả `[]` **bên trong** `'use cache'` với `cacheLife('minutes')` | Layout nằm trong static shell. Bắt lỗi bên ngoài hàm cache thì `[]` bị nướng vào shell lúc build (BE không truy cập được) và không có entry nào để revalidate. `cacheLife` có điều kiện được docs Next 16 cho phép (một nhánh chạy mỗi lần gọi) |

## 3. Back-end

### 3.1 Bảng `category_topics`

Migration mới `<ts>_category_topics`, khai hoàn toàn trong `schema.prisma` (không có SQL viết tay):

```prisma
model CategoryTopic {
  categoryId String @db.Uuid // chỉ category cấp 2
  topicId    String @db.Uuid
  position   Int    @default(0)

  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  topic    Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([categoryId, topicId])
  @@index([categoryId, position])
  @@map("category_topics")
}
```

Relation ngược: `Category.popularTopics CategoryTopic[]`, `Topic.categories CategoryTopic[]`.

- Một topic nằm được ở nhiều cấp 2 (Python ở cả "Khoa học dữ liệu" và "Ngôn ngữ lập trình").
- "Chỉ gắn vào cấp 2" do seed đảm bảo, không thêm trigger: chỉ seed ghi bảng này. Khi có admin sửa thì kiểm ở service.

### 3.2 Seed

Migration riêng `<ts>_category_topics_seed` (theo cách `taxonomy_seed` làm):

- Mỗi category cấp 2 (25 node) tối đa **9 topic**, chọn tay từ topic đã có, bám menu Udemy. Ví dụ `web-development`: `javascript, angular, react, typescript, fastapi, aspnet-core, html, nodejs, nextjs`.
- `INSERT ... SELECT ... JOIN categories ... JOIN topics ... ON CONFLICT DO NOTHING`, idempotent. Slug không tồn tại → JOIN loại dòng đó, nên test §6 kiểm số dòng.
- Category cấp 2 không có topic phù hợp trong DB (vd `other-it-and-software`) được phép trống. Cột 3 khi đó không hiện.

### 3.3 API

`CategoriesModule` mới (`src/categories/`): controller + service, đăng ký trong `AppModule`.

`GET /api/categories/tree`, `@Public()`, header `Cache-Control: public, max-age=300`.

```json
[
  {
    "slug": "development",
    "name": "Phát triển",
    "children": [
      {
        "slug": "web-development",
        "name": "Phát triển web",
        "topics": [{ "slug": "javascript", "name": "JavaScript" }]
      }
    ]
  }
]
```

- Một query Prisma: `category.findMany({ where: { parentId: null }, orderBy: { position }, select: { slug, name, children: { orderBy: { position }, select: { slug, name, popularTopics: { orderBy: { position }, select: { topic: { select: { slug, name } } } } } } } })`, rồi map `popularTopics[].topic` → `topics`.
- Không trả `id`: FE chỉ dựng link từ slug.
- Không cache Redis: Next đã cache phía server (§4.2), endpoint chỉ bị gọi khi revalidate.

## 4. Front-end: dữ liệu

### 4.1 Cấu hình

- `next.config.ts`: `cacheComponents: true`.
- shadcn: `pnpm dlx shadcn add skeleton popover sheet` (style `base-nova`, Base UI).
- Dependency mới: `axios`.

### 4.2 Cây danh mục

`src/lib/api/categories.ts` (chỉ server). URL lấy từ `NEXT_PUBLIC_API_URL` (biến env duy nhất FE đang có, xem `.env.example`):

```ts
export async function getCategoryTree(): Promise<CategoryNode[]> {
  'use cache'
  try {
    // Timeout: BE treo lúc build thì rơi nhanh vào nhánh [] thay vì chờ prerender timeout
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/tree`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`categories/tree ${res.status}`)
    const data: CategoryNode[] = await res.json()
    cacheLife('hours') // sau khi parse OK: mỗi lần gọi chỉ một cacheLife chạy
    return data
  } catch (err) {
    Sentry.captureException(err)
    cacheLife('minutes') // E10: BE lỗi (kể cả lúc build) → shell tự làm lại sau vài phút
    return []
  }
}
```

Mỗi lần gọi chỉ một nhánh `cacheLife` chạy. Kết quả rỗng sống ngắn nên menu tự có lại khi BE lên, không phải chờ deploy.

Type `CategoryNode`, `SubcategoryNode`, `TopicLink` thêm vào `src/types/index.ts`.

**`src/components/layout/site-header.tsx`** (Server Component, E9):

```tsx
export default async function SiteHeader({ cartCount }: { cartCount?: number }) {
  return <Header cartCount={cartCount} categories={await getCategoryTree()} />
}
```

`Header` nhận `categories` là prop **bắt buộc**. Cả 5 chỗ đang dùng `<Header>` (`(student)`, `(cartless)`, `(focus)`, `instructor` layout, `not-found.tsx`) đổi sang `<SiteHeader>`; bỏ sót chỗ nào thì `tsc` báo.

### 4.3 axios

`src/lib/api/client.ts` (cùng thư mục `src/lib/api/` với `categories.ts`):

```ts
export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  withCredentials: true,
})

api.interceptors.response.use(undefined, (err) => {
  if (err.response?.status === 401 && typeof window !== 'undefined') {
    if (location.pathname.startsWith('/login')) return Promise.reject(err) // tránh vòng lặp reload
    const url = new URL('/login', location.origin)
    url.searchParams.set('redirect', safeRedirect(location.pathname + location.search))
    window.location.assign(url) // URL object: lint no-location-assign-relative-destination sạch
  }
  return Promise.reject(err)
})
```

Feature này chưa có chỗ gọi `api`. File tạo sẵn theo yêu cầu (FE dùng axios) làm điểm chuẩn cho các feature sau.

### 4.4 Loading + skeleton

Mỗi route group một `loading.tsx` (Next tự bọc page trong `<Suspense>`). Skeleton mỗi loại một file trong
`src/components/skeletons/`, tên `<Thứ-mô-phỏng>Skeleton`, file là kebab-case của tên đó, dựng từ
`<Skeleton>` của shadcn:

| File | Component | Dùng ở |
|---|---|---|
| `course-card-skeleton.tsx` | `CourseCardSkeleton` | trong `CourseGridSkeleton` |
| `course-grid-skeleton.tsx` | `CourseGridSkeleton` | `(student)/loading.tsx` |
| `auth-form-skeleton.tsx` | `AuthFormSkeleton` | `(auth)/loading.tsx` |
| `learn-layout-skeleton.tsx` | `LearnLayoutSkeleton` | `(focus)/loading.tsx`, `learn/loading.tsx` |
| `instructor-dashboard-skeleton.tsx` | `InstructorDashboardSkeleton` | `instructor/loading.tsx` |
| `centered-content-skeleton.tsx` | `CenteredContentSkeleton` | `(cartless)/loading.tsx` |

Header nằm ở layout nên vẫn hiện khi page đang load. Ô avatar đang chờ `useSession` đổi từ `animate-pulse` tự viết sang `<Skeleton>`.

### 4.5 Đưa build về sạch

Bật `cacheComponents` xong chạy `next build`, sửa đến khi hết lỗi blocking-route:

- 13 page Server Component đọc `params`/`searchParams`: `loading.tsx` ở §4.4 là đủ. Page nào vẫn lỗi thì bọc `<Suspense>` quanh phần đọc dữ liệu.
- `instructor/courses/page.tsx`, `instructor/analytics/revenue/page.tsx` dùng `new Date()`: `await connection()` trước khi đọc giờ, hoặc chuyển phần đó sang client, theo lỗi Next báo. `connection()` cần nằm trong `<Suspense>` (docs `02-guides/migrating-to-cache-components.md`): `instructor/loading.tsx` đã cung cấp.
- `onboarding/page.tsx` không đọc dữ liệu request nên không cần `loading.tsx`; build báo thì thêm `CenteredContentSkeleton`.

### 4.6 Đổi route chi tiết khoá (E8)

- Chuyển `src/app/(student)/courses/[slug]/` → `src/app/(student)/course/[slug]/`.
- Sửa mọi link chi tiết khoá sang `/course/${slug}`: `components/shared/product-ui.tsx` (2 chỗ), `(student)/cart/_components/cart-view.tsx`, `(student)/skills/page.tsx` (các `link` trong lộ trình), `instructor/courses/page.tsx:87` (nút "Xem trước").
- Trong page đã chuyển, `PageProps<'/courses/[slug]'>` → `PageProps<'/course/[slug]'>`.
- Kiểm lại: ``grep -rnE "[`'\"]/courses/" it-course-platform/src | grep -v category-links`` không còn dòng nào. Mẫu khớp theo nội dung (chuỗi bắt đầu bằng `/courses/`), nên tự bỏ qua `/instructor/courses/...` mà vẫn bắt link sót trong file `instructor/courses/page.tsx`.
- `src/app/(student)/courses/page.tsx` (danh sách/tìm kiếm) giữ nguyên.

## 5. Front-end: UI

### 5.1 Header responsive (breakpoint `lg` = 1024px)

| | < 1024px | ≥ 1024px |
|---|---|---|
| Trái | ☰ (mở drawer) | Logo · **Khám phá** |
| Giữa | Logo | Ô tìm kiếm pill (flex-1) |
| Phải | 🔍 · 🛒 | Dạy học · 🌙 · 🛒 · (đăng nhập: 💬 🔔 avatar / chưa: Đăng nhập, Đăng ký) |

- Mobile bấm 🔍 → hàng tìm kiếm full-width dưới header, có ✕. Submit → `/courses?q=` như hiện tại.
- Bỏ mảng `tracks` và khối mobile menu cũ trong `header.tsx`.
- Danh sách link tài khoản tách thành `accountLinks` dùng chung cho dropdown avatar và drawer.

### 5.2 Mega menu desktop: `src/components/layout/explore-menu.tsx`

- `Popover` (shadcn/Base UI), trigger "Khám phá" với `openOnHover`, delay ~150ms. Esc, click ngoài, focus, `aria-expanded` do Base UI lo.
- Panel: 3 cột `w-72` liền nhau, `rounded-lg border shadow-md bg-popover`.
- Item: `<Link>` `flex items-center justify-between px-4 py-2 text-sm` + `ChevronRight`. Active: `text-primary bg-muted`.
- Cột 3: tiêu đề "Các chủ đề phổ biến" (`px-4 pt-4 text-sm font-bold text-muted-foreground`), item topic không có chevron.
- State `activeL1`, `activeL2` (slug). `onMouseEnter` của item cấp 1 đặt `activeL1` (reset `activeL2`); của cấp 2 đặt `activeL2`.
- Bàn phím: mở bằng Enter/click thì Base UI focus dòng đầu cột 1 (chưa mở cột 2). Tab đi trong cột; `→` trên dòng có `›` mở cột kế và focus dòng đầu; `←` về dòng cha. Không mở cột theo `onFocus` (Tab qua cột 1 sẽ liên tục đổi cột 2).
- Mở popover: chưa chọn gì, chỉ cột 1. Cột 2 hiện khi có `activeL1`; cột 3 khi `activeL2` có topic.
- `categories` rỗng → panel một dòng "Không tải được danh mục".

### 5.3 Drawer mobile: `src/components/layout/mobile-nav.tsx`

- `Sheet` `side="left"`, `w-72`. Overlay, ✕, Esc, focus trap do Base UI lo.
- State `stack: string[]` (`[]` | `[l1]` | `[l1, l2]`). Ba màn nằm cạnh nhau, trượt bằng `translate-x` + `transition-transform`.
  - Gốc: chưa đăng nhập → Đăng nhập, Đăng ký; đã đăng nhập → tên, email. Tiếp theo tiêu đề "Danh mục" + category cấp 1 có `›` (như Udemy). Đã đăng nhập: Tin nhắn, Thông báo (header mobile ẩn 💬 🔔), `accountLinks`, Chuyển sang Giảng viên, Đăng xuất. Cuối: Dạy học, nút sáng/tối.
  - Cấp 1: "‹ Menu" (pop), "Tất cả {tên cấp 1}", cấp 2 có `›`.
  - Cấp 2: "‹ {tên cấp 1}", "Tất cả {tên cấp 2}", tiêu đề "Các chủ đề phổ biến", topic.
- Bấm link → đóng sheet. Mở lại → `stack = []`.

### 5.4 Link

`src/lib/category-links.ts`, dùng chung desktop và mobile:

- `categoryHref(l1)` → `/courses/{l1}`
- `categoryHref(l1, l2)` → `/courses/{l1}/{l2}`
- `topicHref(slug)` → `/topic/{slug}`

## 6. Kiểm thử

**BE (vitest e2e, như `taxonomy.e2e-spec.ts`)**

- `GET /api/categories/tree` không cookie → 200, có header `Cache-Control`
- Tầng ngoài của response đúng bằng tập category cấp 1 trong DB (so slug với `parentId IS NULL`); `children` không có `children`; thứ tự theo `position`
- `web-development` có topic `javascript`
- Chạy seed `category_topics` 2 lần → số dòng không đổi
- Mỗi category cấp 2 có ≤ 9 topic; mọi `category_topics.categoryId` là node cấp 2

**FE**

- `src/lib/category-links.test.ts` (`node:test`, như `safe-redirect.test.ts`), chạy bằng `node --test src/lib/category-links.test.ts` (Node 24 chạy thẳng TS)
- `next build` sạch, `pnpm lint` sạch
- BE `tsc --noEmit` sạch (trừ lỗi có sẵn ở `src/sentry-redact.spec.ts`, ngoài phạm vi)

**Kiểm tay bằng Chrome DevTools**

- 1440px: hover qua 3 cột; Enter mở, `→`/`←` qua lại giữa các cột; Esc đóng
- 390px: header mobile; 🔍 mở hàng tìm kiếm; drawer đi sâu 2 cấp và quay lại; bấm link đóng drawer
- Tắt BE: header vẫn render, menu "Không tải được danh mục"; bật lại BE, vài phút sau menu có lại (E10)
- `/courses/development` không còn mở trang chi tiết khoá; `/course/<slug>` mở đúng trang khoá
- Skeleton hiện ở các route group khi page đang load

## 7. Cập nhật tài liệu khác

- `2026-09-29-udemy-taxonomy-topics-design.md`: ghi chú ở D4 và §5 "Thay bằng bảng `category_topics`, xem `2026-09-30-explore-menu-design.md`"
