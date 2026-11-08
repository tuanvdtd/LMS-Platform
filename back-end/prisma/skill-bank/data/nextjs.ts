import type { SkillSeedQuestion } from '../types.ts';

// 13 easy · 14 medium · 13 hard; 9 câu multiple_choice.
// Phạm vi: App Router, Next.js 16 (bản ổn định hiện tại 16.4). Câu nào phụ thuộc mô hình cache đều ghi rõ
// "không bật Cache Components" (mặc định của dự án có sẵn, cấu hình `cacheComponents` chưa bật).
// Đáp án rà theo nextjs.org/docs (2026-11-04). Vị trí đúng và độ dài đáp án rải có chủ ý (validateBank strict kiểm).
export const NEXTJS: SkillSeedQuestion[] = [
  // ───── easy (13) ─────
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'File `app/products/page.tsx` không có directive nào ở đầu file, export `async function Page()` gọi `await db.product.findMany()` rồi render danh sách. Phát biểu nào đúng?',
    options: [
      { content: 'Page là Client Component mặc định, nên phải chuyển truy vấn sang một Route Handler' },
      { content: 'Page chạy cả ở server lẫn trình duyệt, nên mã truy vấn vẫn nằm trong bundle JS' },
      { content: 'Page là Server Component mặc định, mã truy vấn không được gửi xuống trình duyệt', correct: true },
      { content: "Page chỉ được khai báo `async` khi thêm `'use server'` ở đầu file" },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `\`Hello\` là Client Component được render trong một page. Chạy \`next dev\`, người dùng mở trực tiếp URL của page đó (tải trang lần đầu). Dòng log xuất hiện ở đâu?

\`\`\`tsx
'use client'

export default function Hello() {
  console.log('Hello rendered')
  return <p>Hello</p>
}
\`\`\``,
    options: [
      { content: 'Ở console trình duyệt, vì Client Component không được render trên server' },
      { content: 'Ở terminal server khi render HTML, rồi ở console trình duyệt khi hydrate', correct: true },
      { content: 'Ở terminal của server, vì trình duyệt nhận sẵn HTML nên không render lại' },
      { content: 'Ở console trình duyệt, sau khi người dùng tương tác với trang lần đầu' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Trong Next.js 16, route `app/blog/[slug]/page.tsx`. Cách đọc `slug` nào đúng?',
    options: [
      { content: '`export default function Page({ params }) { const { slug } = params }`' },
      { content: '`export default function Page() { const { slug } = useRouter().query }`' },
      { content: '`export default async function Page({ searchParams }) { const { slug } = await searchParams }`' },
      { content: '`export default async function Page({ params }) { const { slug } = await params }`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Route `app/shop/[...slug]/page.tsx`. Những phát biểu nào đúng?',
    options: [
      { content: '`/shop` khớp route này, với `slug` là mảng rỗng `[]`' },
      { content: "`/shop/a/b` khớp route này, với `slug` là `['a', 'b']`", correct: true },
      { content: "`/shop/a/b` khớp route này, với `slug` là chuỗi `'a/b'`" },
      { content: "`/shop/a` khớp route này, với `slug` là `['a']`", correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Menu trong root layout dùng `<a href="/about">` thay vì `<Link href="/about">`. Khi người dùng bấm, khác biệt chính là gì?',
    options: [
      { content: '`<a>` tải lại toàn trang; `<Link>` điều hướng phía client, giữ layout dùng chung', correct: true },
      { content: 'Không khác gì, vì Next.js tự chặn thẻ `<a>` nội bộ để điều hướng phía client' },
      { content: '`<a>` không dẫn được tới route trong thư mục `app/`, chỉ dùng cho URL bên ngoài' },
      { content: '`<Link>` cũng tải lại toàn trang, chỉ khác là nó prefetch trước còn `<a>` thì không' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: '`app/dashboard/layout.tsx` render một ô tìm kiếm (Client Component có state). Người dùng gõ chữ vào ô, rồi bấm `<Link>` từ `/dashboard/orders` sang `/dashboard/users`. Ô tìm kiếm thế nào?',
    options: [
      { content: 'Bị xoá trắng, vì layout được mount lại mỗi khi page con thay đổi' },
      { content: 'Bị xoá trắng, vì layout là Server Component nên render lại cả cây con' },
      { content: 'Giữ nguyên chữ đã gõ, vì layout dùng chung không bị mount lại', correct: true },
      { content: 'Giữ nguyên chữ với điều kiện ô tìm kiếm được bọc trong `<Suspense>`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Có file `app/dashboard/loading.tsx`. Từ trang chủ, người dùng bấm `<Link>` tới `/dashboard`; page này mất vài giây để lấy dữ liệu. Người dùng thấy gì trong lúc chờ?',
    options: [
      { content: 'Trang cũ đứng yên tới khi page lấy xong dữ liệu; `loading.tsx` chỉ dùng cho lần tải trang đầu' },
      { content: 'Root layout vẫn hiển thị, vị trí của page hiện UI trong `loading.tsx` rồi được thay khi xong', correct: true },
      { content: 'UI trong `loading.tsx` thay cho cả root layout, nên header và menu tạm biến mất' },
      { content: '`loading.tsx` chỉ hiện khi page là Client Component tự lấy dữ liệu trong `useEffect`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Trong `app/posts/[id]/page.tsx`, truy vấn không tìm thấy bài viết theo `id`. Cách nào hiển thị UI của file `not-found.tsx` gần nhất?',
    options: [
      { content: "`throw new Error('Not found')`; `not-found.tsx` gần nhất sẽ bắt lỗi này" },
      { content: '`return null`, Next.js tự hiển thị trang 404 khi page không render gì' },
      { content: "`redirect('/not-found')` để chuyển tới file `not-found.tsx` ở thư mục gốc" },
      { content: 'Gọi `notFound()` từ `next/navigation`; hàm này dừng render segment', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Với component `next/image`, khi nào **bắt buộc** truyền cả `width` và `height`?',
    options: [
      { content: "Khi import ảnh tĩnh (`import hero from './hero.png'`), vì Next.js không đọc được kích thước tệp" },
      { content: 'Khi `src` là chuỗi đường dẫn (ảnh trong `public/` hay URL remote) và không dùng `fill`', correct: true },
      { content: 'Chỉ khi `src` là URL remote; ảnh trong `public/` được Next.js tự đọc kích thước' },
      { content: 'Với ảnh dùng `fill`, vì Next.js cần kích thước để tính được `srcset`' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Những việc nào buộc component phải là Client Component?',
    options: [
      { content: 'Dùng `useState` để mở / đóng menu khi bấm nút', correct: true },
      { content: 'Truy vấn database bằng Prisma để render danh sách sản phẩm' },
      { content: 'Đọc `localStorage` để lấy theme người dùng đã lưu', correct: true },
      { content: 'Đọc biến môi trường bí mật để gọi API của bên thứ ba' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Cách nào đặt `<title>` cho trang `/about` đúng chuẩn App Router?',
    options: [
      { content: 'Viết `<head><title>About</title></head>` thủ công trong root layout' },
      { content: "`export const metadata = { title: 'About' }` trong `app/about/page.tsx`", correct: true },
      { content: "`export async function generateMetadata()` trả về `{ title: 'About' }` trong `app/about/page.tsx`", correct: true },
      { content: "`export const metadata` trong `app/about/page.tsx` có `'use client'` ở đầu file" },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Khi người dùng bấm "Đăng", Server Action \`createPost\` nhận được gì làm tham số đầu tiên?

\`\`\`tsx
<form action={createPost}>
  <input name="title" />
  <button>Đăng</button>
</form>
\`\`\``,
    options: [
      { content: 'Một đối tượng `FormData` chứa các trường có `name` của form', correct: true },
      { content: 'Đối tượng sự kiện `SubmitEvent`, cần gọi `preventDefault()` trước' },
      { content: "Một object thường `{ title: '...' }` đã được Next.js parse sẵn" },
      { content: 'Không có tham số; phải đọc dữ liệu form bằng `useFormStatus()`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Next.js 16, không bật Cache Components. `app/products/page.tsx` đang được prerender tĩnh lúc build. Lập trình viên thêm `const { sort } = await searchParams` để sắp xếp danh sách. Route này thay đổi thế nào?',
    options: [
      { content: 'Trang vẫn tĩnh; `sort` được đọc ở trình duyệt sau khi hydrate' },
      { content: 'Next.js prerender sẵn một bản cho mỗi giá trị `sort` gặp được lúc build' },
      { content: 'Trang chuyển sang render động, chạy lại trên server ở mỗi request', correct: true },
      { content: 'Build lỗi, vì trang đã prerender tĩnh không được đọc `searchParams`' },
    ],
  },

  // ───── medium (14) ─────
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `\`Modal\` là Client Component; \`Cart\` là async Server Component đọc giỏ hàng từ database. Phát biểu nào đúng về đoạn code sau?

\`\`\`tsx
// app/page.tsx (Server Component)
import Modal from './ui/modal' // có 'use client'
import Cart from './ui/cart'

export default function Page() {
  return (
    <Modal>
      <Cart />
    </Modal>
  )
}
\`\`\``,
    options: [
      { content: 'Lỗi, vì Client Component không được nhận Server Component qua `children`' },
      { content: '`Cart` bị kéo vào bundle client vì nằm trong `Modal`, nên truy vấn database lỗi' },
      { content: '`Cart` chỉ chạy được nếu chuyển dòng `import Cart` vào bên trong `modal.tsx`' },
      { content: '`Cart` vẫn render trên server; `Modal` chỉ nhận kết quả render qua `children`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `\`lib/data.ts\` không có directive nào và không import \`server-only\`:

\`\`\`ts
export async function getData() {
  const res = await fetch('https://api.example.com/data', {
    headers: { authorization: process.env.API_KEY ?? '' },
  })
  return res.json()
}
\`\`\`

Một Client Component import \`getData\` và gọi nó trong \`useEffect\`. Điều gì xảy ra?`,
    options: [
      { content: 'Hàm chạy trong trình duyệt, `API_KEY` không có giá trị thật nên thiếu khoá', correct: true },
      { content: 'Next.js tự chuyển lời gọi `getData()` thành request lên server, nên vẫn chạy đúng' },
      { content: 'Hàm chạy trong trình duyệt và giá trị thật của `API_KEY` bị lộ trong bundle JS' },
      { content: 'Build thất bại ngay, vì file dùng `process.env` không có tiền tố `NEXT_PUBLIC_`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: '`app/shop/layout.tsx` (Server Component) muốn tô đậm danh mục đang chọn theo `?category=` trên URL, và phải cập nhật khi người dùng đổi danh mục bằng `<Link>`. Cách nào đúng?',
    options: [
      { content: 'Đọc prop `searchParams` mà Next.js truyền vào layout, giống như với page' },
      { content: 'Đặt trong layout một Client Component dùng `useSearchParams()`, bọc `<Suspense>`', correct: true },
      { content: 'Gọi `headers()` trong layout để lấy URL hiện tại rồi tự parse `category`' },
      { content: "Thêm `export const dynamic = 'force-dynamic'` để layout nhận prop `searchParams`" },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: "Next.js 16, không bật Cache Components. `app/posts/[id]/page.tsx` có `generateStaticParams()` trả về `[{ id: '1' }, { id: '2' }]` và **không** khai báo `dynamicParams`. Những phát biểu nào đúng?",
    options: [
      { content: '`/posts/3` trả về 404, vì `id` này không có trong `generateStaticParams`' },
      { content: '`/posts/1` và `/posts/2` được prerender trong lúc `next build`', correct: true },
      { content: 'Khi ISR làm mới `/posts/1`, `generateStaticParams` được gọi lại để lấy danh sách mới' },
      { content: 'Thêm `export const dynamicParams = false` thì `/posts/3` mới trả về 404', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: 'Next.js 16, không bật Cache Components / Partial Prefetching. Với `<Link>` để `prefetch` mặc định, những phát biểu nào đúng?',
    options: [
      { content: 'Chạy `next dev` không thấy request prefetch trong tab Network là hành vi đúng', correct: true },
      { content: 'Route động không có `loading.tsx` cũng được prefetch đầy đủ dữ liệu như route tĩnh' },
      { content: 'Đặt `prefetch={false}` thì Link vẫn prefetch khi người dùng rê chuột lên' },
      { content: 'Với route tĩnh, toàn bộ route được prefetch khi Link đi vào viewport', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Bấm nút submit thì báo lỗi \`formData.get is not a function\` (các import đã đủ). Vì sao?

\`\`\`tsx
// app/actions.ts
'use server'
export async function save(formData: FormData) {
  const name = formData.get('name')
  return { ok: true }
}

// app/form.tsx
'use client'
export function Form() {
  const [state, formAction] = useActionState(save, { ok: false })
  return <form action={formAction}>...</form>
}
\`\`\``,
    options: [
      { content: 'Gọi qua `useActionState` thì Server Action chỉ nhận object JSON, không nhận `FormData`' },
      { content: "Thiếu `'use server'` trong `form.tsx`, nên `save` bị chạy ở trình duyệt" },
      { content: 'Hàm trong `useActionState` nhận state cũ ở tham số đầu, `FormData` ở tham số thứ hai', correct: true },
      { content: 'Server Action dùng với `useActionState` không được trả về object như `{ ok: true }`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Trang \`/blog\` có những thẻ Open Graph nào?

\`\`\`tsx
// app/layout.tsx
export const metadata = {
  title: 'Acme',
  openGraph: { title: 'Acme', description: 'Acme là...' },
}

// app/blog/page.tsx
export const metadata = {
  title: 'Blog',
  openGraph: { title: 'Blog' },
}
\`\`\``,
    options: [
      { content: 'Chỉ `og:title` = Blog; `og:description` của layout không còn', correct: true },
      { content: '`og:title` = Blog và `og:description` = Acme là... (gộp sâu từng trường)' },
      { content: '`og:title` = Acme và `og:description` = Acme là..., vì layout ưu tiên hơn page' },
      { content: 'Hai thẻ `og:title` (Acme và Blog) cùng `og:description` của layout' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `\`db.post.create\` chạy thành công. Kết quả khi form gọi action này?

\`\`\`ts
'use server'
import { redirect } from 'next/navigation'

export async function save(prev: unknown, formData: FormData) {
  try {
    await db.post.create({ data: { title: String(formData.get('title')) } })
    redirect('/posts')
  } catch (e) {
    return { error: 'Lưu thất bại' }
  }
}
\`\`\``,
    options: [
      { content: 'Chuyển tới `/posts`, vì `redirect()` được Next.js xử lý trước khi chạy vào khối `catch`' },
      { content: "Không chuyển trang; action trả về `{ error: 'Lưu thất bại' }` dù bài đã được lưu", correct: true },
      { content: "Chuyển tới `/posts` và đồng thời trả về `{ error: 'Lưu thất bại' }` cho form" },
      { content: 'Lỗi build, vì không được gọi `redirect()` bên trong một Server Action' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: "Trong `app/page.tsx` (Server Component), lập trình viên viết `(await cookies()).set('visited', '1')` ngay trong thân component để đánh dấu người dùng đã ghé. Điều gì xảy ra?",
    options: [
      { content: 'Cookie được đặt bình thường qua header `Set-Cookie` của response HTML' },
      { content: 'Ném lỗi khi build, vì Server Component không được gọi `cookies()`' },
      { content: 'Cookie được đặt, nhưng có hiệu lực từ lần điều hướng phía client kế tiếp' },
      { content: 'Ném lỗi khi render: `.set` chỉ dùng trong Server Function, Route Handler', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: 'Next.js 16, không bật Cache Components. Trang tĩnh `app/blog/page.tsx` có `export const revalidate = 60`. Điều gì xảy ra với trang này sau khi deploy?',
    options: [
      { content: 'Server tự tạo lại trang đúng mỗi 60 giây bằng một tác vụ chạy nền' },
      { content: 'Trang được render động ở mỗi request, và mỗi lần render được phép chạy tối đa 60 giây' },
      { content: 'Quá 60 giây, request kế tiếp vẫn nhận bản cũ và kích hoạt tạo lại trang ở nền', correct: true },
      { content: 'Trình duyệt của từng người dùng tự cache trang trong 60 giây rồi tải lại' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Next.js 16 (file \`middleware.ts\` đã đổi tên thành \`proxy.ts\`). Người chưa đăng nhập mở \`/login\`: HTML trả về nhưng trang mất toàn bộ CSS và nút bấm không phản hồi. Nguyên nhân?

\`\`\`ts
// proxy.ts (toàn bộ file)
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
\`\`\``,
    options: [
      { content: 'Thiếu matcher nên proxy chạy cả với file `/_next/static` và chuyển chúng về `/login`', correct: true },
      { content: 'Proxy chạy ở Edge runtime nên không đọc được cookie khi trình duyệt tải file tĩnh' },
      { content: 'Nhánh `/login` không `return NextResponse.next()`, nên response thiếu CSS và JavaScript' },
      { content: '`NextResponse.redirect` chỉ dùng được với request trang, không dùng được với file tĩnh' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Ảnh chỉ hiển thị trong khung 300×200px, nhưng trên màn hình rộng 1920px, file ảnh tải về có độ rộng gần bằng màn hình. Nguyên nhân?

\`\`\`tsx
<div style={{ position: 'relative', width: 300, height: 200 }}>
  <Image src="/banner.jpg" alt="Banner" fill />
</div>
\`\`\``,
    options: [
      { content: '`fill` tắt tối ưu ảnh nên tải ảnh gốc, phải bỏ `fill` thì mới có `srcset`' },
      { content: 'Thiếu `sizes`, nên trình duyệt giả định ảnh rộng `100vw` khi chọn từ `srcset`', correct: true },
      { content: 'Thiếu `quality`, nên Next.js mặc định phục vụ ảnh ở độ phân giải gốc' },
      { content: 'Thiếu `width` / `height` trên `<Image>`, nên Next.js không biết khung chỉ 300px' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `\`tab-panel.tsx\` **không** có \`'use client'\` nhưng có dùng \`useState\`. Phát biểu nào đúng?

\`\`\`tsx
// tabs.tsx
'use client'
import TabPanel from './tab-panel'

export default function Tabs() {
  return <TabPanel />
}
\`\`\``,
    options: [
      { content: "Lỗi build, vì `tab-panel.tsx` dùng hook mà không tự khai báo `'use client'`" },
      { content: 'Chạy đúng cả khi Server Component import nó, vì Next.js tự nhận ra `useState`' },
      { content: '`TabPanel` vẫn là Server Component, nên `useState` trong nó bị bỏ qua khi `Tabs` render' },
      { content: 'Chạy đúng khi được `Tabs` import; lỗi nếu một Server Component import trực tiếp nó', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: 'Dự án có `app/(marketing)/layout.tsx` và `app/(shop)/layout.tsx` là hai root layout (không có `app/layout.tsx`). Những phát biểu nào đúng?',
    options: [
      { content: '`app/(marketing)/about/page.tsx` có URL là `/about`', correct: true },
      { content: 'Bấm `<Link>` từ một trang `(shop)` sang một trang `(marketing)` vẫn giữ nguyên state phía client' },
      { content: 'Có cả `(marketing)/about/page.tsx` và `(shop)/about/page.tsx` sẽ gây lỗi xung đột đường dẫn', correct: true },
      { content: "Tên group xuất hiện trong `params`, ví dụ `{ group: 'marketing' }`" },
    ],
  },

  // ───── hard (13) ─────
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: '`Chart` là Client Component, được render từ một Server Component. Những giá trị nào truyền được qua props của `Chart`?',
    options: [
      { content: 'Một `Promise` chưa resolve, để `Chart` đọc bằng `use()` bên trong `<Suspense>`', correct: true },
      { content: "Một hàm thường `(v) => v + '%'` để `Chart` dùng định dạng nhãn trục" },
      { content: "Một Server Function được khai báo với `'use server'`", correct: true },
      { content: 'Một instance của class `Report` có method `toCSV()` để `Chart` gọi khi bấm nút' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: '`app/dashboard/layout.tsx` ném lỗi trong lúc render. Có cả `app/error.tsx` và `app/dashboard/error.tsx` (không có `global-error.tsx`). Người dùng mở `/dashboard/stats` thấy gì?',
    options: [
      { content: 'UI của `app/dashboard/error.tsx`, vì nó nằm cùng segment với layout bị lỗi' },
      { content: 'Trang lỗi mặc định, vì lỗi trong layout không error boundary nào bắt được' },
      { content: 'UI của `app/error.tsx`, vì `error.tsx` không bọc layout của chính segment nó', correct: true },
      { content: 'UI của `app/dashboard/error.tsx` nếu page `stats` render xong trước khi layout lỗi' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: 'Next.js 16. Route `app/blog/[slug]/page.tsx`. File `app/blog/template.tsx` render trực tiếp một Client Component `<Counter />` (có state đếm) phía trên `{children}`. Người dùng bấm tăng bộ đếm lên 5, rồi điều hướng bằng `<Link>`: `/blog/a` → `/blog/b` → `/blog/b?sort=new`. Giá trị bộ đếm sau mỗi bước?',
    options: [
      { content: 'Giữ 5 ở cả hai bước, vì template cũng được giữ lại như layout' },
      { content: 'Về 0 khi sang `/blog/b`, rồi giữ nguyên khi chỉ đổi `?sort=new`', correct: true },
      { content: 'Về 0 ở cả hai bước, vì template được mount lại khi URL thay đổi' },
      { content: 'Giữ 5 khi sang `/blog/b`, rồi về 0 khi query string thay đổi' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Next.js 16, không bật Cache Components. Sau \`next build && next start\`, giá trên API thay đổi mỗi phút. Người dùng tải lại \`/\` nhiều lần thấy gì?

\`\`\`tsx
// app/page.tsx — không có route segment config nào khác
export default async function Page() {
  const res = await fetch('https://api.example.com/price')
  const { price } = await res.json()
  return <p>{price}</p>
}
\`\`\``,
    options: [
      { content: 'Giá mới ở mỗi lần tải, vì từ Next.js 15 trở đi `fetch` không còn được cache mặc định' },
      { content: 'Giá mới sau mỗi 60 giây, vì route tĩnh có thời gian revalidate mặc định' },
      { content: "Giá lúc build, vì `fetch` không truyền option sẽ mặc định là `'force-cache'`" },
      { content: 'Giá lúc build, vì route được prerender tĩnh và `fetch` chỉ chạy trong `next build`', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Next.js 16, không bật Cache Components. Hai trang cùng gắn tag \`posts\`:

\`\`\`tsx
// app/blog/page.tsx
await fetch('https://api.example.com/posts', {
  cache: 'force-cache', next: { tags: ['posts'] },
})
// app/dashboard/page.tsx
await fetch('https://api.example.com/posts?limit=5', {
  cache: 'force-cache', next: { tags: ['posts'] },
})
\`\`\`

Một Server Action thêm bài mới rồi chỉ gọi \`revalidatePath('/blog')\`. Sau đó người dùng mở \`/dashboard\`, thấy gì?`,
    options: [
      { content: 'Danh sách cũ, vì chỉ đường dẫn `/blog` bị invalidate, tag `posts` thì chưa', correct: true },
      { content: 'Danh sách mới, vì `revalidatePath` làm mới cả các fetch cùng tag với trang `/blog`' },
      { content: "Danh sách cũ, vì dữ liệu `'force-cache'` không bị `revalidatePath` làm mới" },
      { content: 'Danh sách mới, vì `revalidatePath` trong Server Action khiến các trang đã ghé gọi lại API' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: 'Next.js 16. Những phát biểu nào đúng về `updateTag` và `revalidateTag`?',
    options: [
      { content: "`updateTag('posts')` chỉ gọi được trong Server Action; gọi trong Route Handler sẽ ném lỗi", correct: true },
      { content: "`revalidateTag('posts', 'max')` khiến request kế tiếp phải chờ dữ liệu mới thay vì nhận bản cũ" },
      { content: "Webhook (Route Handler) cần xoá dữ liệu ngay thì dùng `revalidateTag('posts', { expire: 0 })`", correct: true },
      { content: "`revalidateTag('posts', 'max')` trong Server Action trả về trang đã render lại với dữ liệu mới" },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: "Trang `/admin` kiểm tra quyền admin rồi `redirect('/login')` nếu không đạt; trang render một form gọi Server Action `deleteAllUsers` (export từ file `'use server'`). Những biện pháp nào thực sự ngăn người không phải admin gọi được `deleteAllUsers`?",
    options: [
      { content: 'Kiểm tra quyền admin trong `app/admin/layout.tsx`, vốn bọc trang `/admin`' },
      { content: 'Kiểm tra session và quyền admin ngay bên trong `deleteAllUsers`', correct: true },
      { content: 'Kiểm tra quyền ở page rồi truyền `isAdmin` vào action bằng `.bind`' },
      { content: 'Cho `deleteAllUsers` gọi hàm DAL `server-only`, hàm đó kiểm tra quyền trước khi xoá', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: 'Next.js 16, không bật Cache Components. `app/dashboard/layout.tsx` gọi `await cookies()` rồi một `fetch` không cache mất 3 giây; `app/dashboard/loading.tsx` tồn tại (không có `loading.tsx` nào khác). Từ `/`, người dùng bấm `<Link href="/dashboard" prefetch={false}>`. Điều gì xảy ra trong 3 giây đó?',
    options: [
      { content: 'Trang `/` đứng yên tới khi layout xong, vì `loading.tsx` nằm dưới layout', correct: true },
      { content: 'UI của `loading.tsx` hiện ngay, che cả phần layout lẫn page trong lúc chờ' },
      { content: 'Layout hiện ngay với khung trống, phần dữ liệu của layout stream vào sau' },
      { content: 'Root layout giữ nguyên, vùng của `/dashboard` để trống tới khi layout xong' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: 'Next.js 16. `app/posts/[id]/loading.tsx` tồn tại. Page lấy bài viết mất 2 giây rồi gọi `notFound()` vì không có bài. Trình duyệt mở trực tiếp `/posts/999`. Response HTTP thế nào?',
    options: [
      { content: 'Status 404 kèm UI not-found, vì `notFound()` ghi đè status khi page chạy xong' },
      { content: 'Status 500 kèm UI lỗi, vì `notFound()` ném lỗi sau khi response đã bắt đầu gửi' },
      { content: 'Status 200 kèm UI not-found, và HTML được chèn thẻ meta `robots` `noindex`', correct: true },
      { content: 'Status 200 kèm UI của `loading.tsx`, vì stream đã bắt đầu nên UI không đổi được' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Biến \`token\` bị closure của Server Action \`sync\` giữ lại. Điều gì xảy ra với giá trị của \`token\`?

\`\`\`tsx
export default async function Page() {
  const token = await getPartnerToken() // bí mật
  async function sync() {
    'use server'
    await callPartner(token)
  }
  return <form action={sync}><button>Đồng bộ</button></form>
}
\`\`\``,
    options: [
      { content: 'Ở lại trên server; trình duyệt chỉ nhận action ID, server tự nhớ `token` theo phiên' },
      { content: 'Được gửi xuống trình duyệt dạng JSON thường, ai xem mã nguồn trang cũng đọc được' },
      { content: 'Bị bỏ đi khi build vì closure không serialize được, nên `token` là `undefined` lúc gọi' },
      { content: 'Được mã hoá rồi gửi xuống client, và gửi ngược lên server khi action được gọi', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `File \`menu.tsx\`:

\`\`\`tsx
'use client'
function Menu({ children }) {
  return <ul>{children}</ul> // có state mở / đóng
}
function Item({ children }) {
  return <li>{children}</li>
}
Menu.Item = Item
export default Menu
\`\`\`

Một Server Component render \`<Menu><Menu.Item>Hồ sơ</Menu.Item></Menu>\`. Kết quả?`,
    options: [
      { content: 'Lỗi: phía server chỉ nhận client reference của `Menu`, nên `Menu.Item` là `undefined`', correct: true },
      { content: 'Chạy bình thường, `Menu.Item` cũng là Client Component vì nằm cùng file' },
      { content: 'Chạy được, nhưng `Menu.Item` được render trên server như một Server Component bình thường' },
      { content: "Lỗi build, vì một file `'use client'` không được gắn thuộc tính tĩnh vào component" },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Next.js 16. \`saveA\`, \`saveB\`, \`saveC\` là ba Server Action độc lập, mỗi action mất khoảng 1 giây trên server. Một Client Component gọi:

\`\`\`tsx
await Promise.all([saveA(), saveB(), saveC()])
\`\`\`

Tổng thời gian chờ phía client xấp xỉ bao nhiêu?`,
    options: [
      { content: 'Khoảng 1 giây, vì `Promise.all` gửi ba request song song' },
      { content: 'Khoảng 3 giây, vì client gửi các Server Action lần lượt từng cái một', correct: true },
      { content: 'Khoảng 1 giây, vì Next.js gộp ba action vào một request duy nhất' },
      { content: 'Khoảng 3 giây, vì server xếp hàng các action và chạy lần lượt từng action' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Hai trang hiển thị \`<title>\` gì?

\`\`\`tsx
// app/layout.tsx
export const metadata = {
  title: { template: '%s | Acme', default: 'Acme' },
}
// app/page.tsx
export const metadata = { title: 'Trang chủ' }
// app/about/page.tsx
export const metadata = { title: 'Giới thiệu' }
\`\`\``,
    options: [
      { content: '`/`: Trang chủ | Acme — `/about`: Giới thiệu | Acme' },
      { content: '`/`: Acme — `/about`: Giới thiệu | Acme' },
      { content: '`/`: Trang chủ — `/about`: Giới thiệu | Acme', correct: true },
      { content: '`/`: Trang chủ — `/about`: Giới thiệu' },
    ],
  },
];
