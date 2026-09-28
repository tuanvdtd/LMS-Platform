# Đăng nhập (email + Google/GitHub), header theo session, quên/đặt lại mật khẩu

- Ngày: 2026-09-28
- Phạm vi: `it-course-platform/` (chính), `back-end/src/auth/auth.ts` + e2e (nhỏ)
- Liên quan: `2026-09-28-auth-better-auth-design.md` (backend), `2026-09-28-register-page-design.md` (trang đăng ký — spec này lấp các mục "ngoài phạm vi" của nó: đăng nhập email, `/forgot-password`)

## 1. Mục tiêu

Hiện form `/login` là mock (submit → `router.push('/')`, điền sẵn dữ liệu), header hiện `demoStudent`, nút Đăng xuất không làm gì, link "Quên mật khẩu?" trỏ tới trang không tồn tại. Nút Google/GitHub đã gọi API thật nhưng luôn đưa về `/onboarding` kể cả user cũ.

**Trong phạm vi**

- Form đăng nhập email + mật khẩu gọi `signIn.email`, xử lý lỗi (sai mật khẩu, chưa xác minh email, 429, mạng)
- Chưa xác minh email → hướng dẫn kiểm tra hộp thư + nút gửi lại (đếm ngược 60s)
- Google/GitHub: user mới → `/onboarding`, user cũ → `/` (hoặc `?redirect=`), lỗi OAuth → banner ở `/login`
- `?redirect=` cho login (email + OAuth), chỉ nhận đường dẫn nội bộ
- `proxy.ts`: đã có cookie session thì không vào được `/login`, `/register`, `/forgot-password`
- Header: user thật từ `useSession`, Đăng xuất thật; chưa đăng nhập → nút Đăng nhập/Đăng ký
- `/forgot-password` và `/reset-password`
- Backend: `revokeSessionsOnPasswordReset`, rate limit `/request-password-reset`

**Ngoài phạm vi**

- RBAC FE (chặn route theo session/role) và gắn `@Roles` vào controller BE — chưa có controller nghiệp vụ; spec sau
- Đổi mật khẩu ở `/settings` — cần chặn route, làm cùng spec RBAC
- Lưu onboarding (`targetTrack`, `level`)
- "Ghi nhớ đăng nhập"

## 2. Quyết định

| Quyết định | Lý do |
|---|---|
| Vẫn gọi thẳng back-end bằng `authClient` (như spec đăng ký) | Client là JS Proxy: `signIn.email` → `POST {NEXT_PUBLIC_API_URL}/api/auth/sign-in/email`, mặc định `credentials: "include"`; BE đã `enableCors({ origin: FE_URL, credentials: true })` + `trustedOrigins: [FE_URL]` |
| Chưa xác minh email → nút gửi lại do user bấm, **không** bật `sendOnSignIn` | Tránh mỗi lần bấm đăng nhập lại gửi thêm mail. Better Auth chỉ trả 403 `EMAIL_NOT_VERIFIED` **sau khi** mật khẩu đúng (`sign-in.mjs`) → không lộ tài khoản cho người không biết mật khẩu |
| Sai email hay sai mật khẩu cùng một câu | BE trả chung 401 `INVALID_EMAIL_OR_PASSWORD`; FE không phân biệt |
| OAuth: `callbackURL` = redirect hoặc `/`, `newUserCallbackURL` = `/onboarding`, `errorCallbackURL` = `/login` | Better Auth 1.7.6 hỗ trợ sẵn cả 3 trong `signIn.social`; lỗi thì BE redirect kèm `?error=...` |
| `proxy.ts` chỉ kiểm tra **có cookie** (`getSessionCookie` từ `better-auth/cookies`), không gọi BE | Nhanh, không nháy form. Next 16 khuyên proxy chỉ dùng cho kiểm tra lạc quan. Cookie đã hết hạn nhưng còn trên trình duyệt → bị đẩy về `/` nhầm; header gọi `useSession` thật nên sẽ hiện nút Đăng nhập, user vẫn thoát ra được |
| Proxy **không** áp cho `/reset-password` | User đang đăng nhập vẫn có thể bấm link đặt lại trong mail |
| Reset thành công → `signOut()` (bỏ qua lỗi) rồi mới sang `/login?reset=1` | BE đã xoá session nhưng trình duyệt còn cookie → proxy sẽ đẩy về `/`, mất banner. `sign-out` luôn xoá cookie kể cả khi session đã bị thu hồi |
| User chưa xác minh vẫn đặt lại mật khẩu được | Đăng nhập sau đó vẫn bị 403 → thấy khối "chưa xác minh". Chấp nhận, không phải bug |
| Prod bắt buộc `COOKIE_DOMAIN` | Cookie do BE (subdomain khác) set; FE chỉ đọc được khi cookie đặt ở domain cha (`crossSubDomainCookies`). Dev chạy chung `localhost` (cookie không tách theo cổng) nên không cần |
| Quên mật khẩu luôn báo "Nếu email có tài khoản…" | `requestPasswordReset` trả 200 cả khi email không tồn tại → chống dò tài khoản |
| Link đặt lại hạn 1 giờ (mặc định `resetPasswordTokenExpiresIn`) | Giữ mặc định; câu hướng dẫn ghi "1 giờ" |
| `revokeSessionsOnPasswordReset: true` | Lộ mật khẩu → đặt lại là đá mọi phiên, kể cả kẻ gian |
| Rate limit `/request-password-reset`: 3 lần / 10 phút | Mặc định Better Auth là 3 lần / 60s cho `/request-password-reset` và `/send-verification-email` (`getDefaultSpecialRules`) → vẫn gửi được ~180 mail/giờ tới hộp thư người khác qua Brevo. Siết lại cho khớp `/sign-up/email`. `/send-verification-email` giữ mặc định 3/60s — khớp nút gửi lại khoá 60s |
| Đăng nhập email dùng luật mặc định `/sign-in/*` (3 lần/10s) | Đủ chặn dò mật khẩu nhanh; không thêm cấu hình |
| Không làm `?redirect=` trên trang đăng ký | Đăng ký → xác minh qua mail → `/onboarding`, không quay về trang cũ |

## 3. Cấu trúc

```
back-end/src/auth/auth.ts                    + revokeSessionsOnPasswordReset, + rule /request-password-reset
back-end/test/auth.e2e-spec.ts               + test 8–10
back-end/README.md                           + mục cấu hình OAuth (redirect URI)

it-course-platform/src/
├── proxy.ts                                 MỚI
├── lib/
│   ├── safe-redirect.ts                     MỚI — safeRedirect(value) → string
│   └── safe-redirect.test.ts                MỚI
├── components/layout/header.tsx             useSession + signOut, bỏ demoStudent
└── app/(auth)/
    ├── _components/
    │   ├── auth-messages.ts                 MỚI — RATE_LIMITED, NETWORK (chuyển từ register-form)
    │   ├── auth-fields.schema.ts            MỚI — emailField, passwordField (chuyển từ register-form.schema)
    │   ├── use-cooldown.ts                  MỚI — hook đếm ngược (chuyển từ SentScreen)
    │   ├── check-email-screen.tsx           MỚI — màn "Kiểm tra email" dùng chung (tách từ SentScreen)
    │   ├── social-buttons.tsx               nhận prop redirect; 3 callback URL
    │   ├── login-view.tsx                   nối API thật
    │   ├── login-form.schema.ts             MỚI
    │   └── login-form.schema.test.ts        MỚI
    ├── login/page.tsx                       đọc searchParams redirect / reset / error → props
    ├── register/_components/
    │   ├── register-form.tsx                dùng auth-messages, check-email-screen
    │   └── register-form.schema.ts          dùng auth-fields.schema
    ├── forgot-password/
    │   ├── page.tsx                         MỚI
    │   └── _components/forgot-password-form.tsx   MỚI
    └── reset-password/
        ├── page.tsx                         MỚI — đọc searchParams token / error
        └── _components/
            ├── reset-password-form.tsx      MỚI
            ├── reset-password.schema.ts     MỚI
            └── reset-password.schema.test.ts MỚI
```

File schema và `safe-redirect.ts` chỉ dùng cú pháp Node strip được và import có đuôi `.ts`, không alias `@/` (để chạy `node --test`, như spec đăng ký).

## 4. Đơn vị

### `safeRedirect(value: string | null | undefined): string`

Trả `value` nếu bắt đầu bằng `/` và **không** bắt đầu bằng `//` hoặc `/\`; ngược lại trả `/`. Dùng ở proxy, login-view, social-buttons.

### `proxy.ts`

```ts
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) return NextResponse.next();
  const to = safeRedirect(request.nextUrl.searchParams.get('redirect'));
  return NextResponse.redirect(new URL(to, request.url));
}
export const config = { matcher: ['/login', '/register', '/forgot-password'] };
```

### Schema (`auth-fields.schema.ts`)

- `emailField` = `z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ'))`
- `passwordField` = 8–128 ký tự (mặc định Better Auth), thông báo như hiện tại
- `registerSchema` dùng lại hai field này, hành vi không đổi (test cũ vẫn phải pass)
- `loginSchema` = `{ email: emailField, password: z.string().min(1, 'Vui lòng nhập mật khẩu') }` — không áp 8–128 khi đăng nhập, để lỗi luôn là "sai email hoặc mật khẩu"
- `forgotPasswordSchema` = `{ email: emailField }` — đặt trong `auth-fields.schema.ts` (một field, không đáng file riêng)
- `resetPasswordSchema` = `{ password: passwordField, confirmPassword }` + refine khớp → lỗi ở `confirmPassword`

### `useCooldown(initial: number)` và `CheckEmailScreen`

- `useCooldown` → `{ cooldown, restart }`, đếm ngược mỗi giây về 0 (logic `useEffect` + `setTimeout` đang có trong `SentScreen`)
- `CheckEmailScreen` props: `title`, `children` (nội dung mô tả), `onResend: () => Promise<string | null>` (trả câu lỗi hoặc null), `footer` (link/nút dưới cùng). Bắt đầu đã khoá 60s. Dùng cho: đăng ký, quên mật khẩu
- `register-form.tsx` thay `SentScreen` bằng `CheckEmailScreen`, giao diện giữ nguyên

## 5. Luồng và giao diện

### `/login`

`page.tsx` (server) đọc `searchParams` (Promise trong Next 16) → `<LoginView redirect reset error />`.

- Form: react-hook-form + zod, `mode: 'onTouched'`, bỏ `defaultValue` mẫu, `autoComplete="email"` / `"current-password"`
- Submit → `authClient.signIn.email({ email, password })` → thành công `router.replace(safeRedirect(redirect))` + `router.refresh()`
- `SocialButtons redirect={redirect}`
- Link "Quên mật khẩu?" → `/forgot-password`

| Tình huống | Hiển thị |
|---|---|
| 401 `INVALID_EMAIL_OR_PASSWORD` | Banner đỏ "Email hoặc mật khẩu không đúng" |
| 403 `EMAIL_NOT_VERIFIED` | Khối cảnh báo "Email chưa được xác minh" + *"Link xác minh đã được gửi khi bạn đăng ký và còn hiệu lực 24 giờ. Hãy kiểm tra hộp thư, cả mục Spam/Quảng cáo, trước khi gửi lại."* + nút outline "Gửi lại email xác minh" (`sendVerificationEmail({ email, callbackURL: origin + '/onboarding' })`, khoá 60s sau mỗi lần bấm, lần đầu không khoá). Gửi thành công → dòng "Đã gửi lại tới {email}" |
| 429 | `RATE_LIMITED` |
| Lỗi mạng / khác | `NETWORK` |
| `?reset=1` | Banner xanh "Đổi mật khẩu thành công, hãy đăng nhập lại" |
| `?error=...` | Banner đỏ "Đăng nhập bằng Google/GitHub không thành công, vui lòng thử lại" |

Banner có `role="alert"` (lỗi) / `role="status"` (thành công); giữ dữ liệu đã nhập, riêng ô mật khẩu xoá khi 401.

### Google / GitHub (`social-buttons.tsx`)

```ts
authClient.signIn.social({
  provider: id,
  callbackURL: origin + safeRedirect(redirect),
  newUserCallbackURL: origin + '/onboarding',
  errorCallbackURL: origin + '/login',
});
```

Trang đăng ký không truyền `redirect` → `/`. Xử lý lỗi `PROVIDER_NOT_FOUND` giữ nguyên.

### Header

- `const { data, isPending } = authClient.useSession()`
- `isPending` → ô tròn xám cùng kích thước avatar (không nháy nút Đăng nhập)
- Không có session → nút ghost "Đăng nhập" (`/login`) + nút primary "Đăng ký" (`/register`); ẩn icon tin nhắn và thông báo (chỉ có nghĩa khi đã đăng nhập); giỏ hàng vẫn hiện
- Có session → avatar `user.image` (fallback 2 chữ đầu của `user.name`), tên, email thật
- Đăng xuất → `await authClient.signOut()` → `router.replace('/')` + `router.refresh()`
- Menu "Chuyển sang Giảng viên" giữ nguyên (RBAC để spec sau)

### `/forgot-password`

- Ô email + nút "Gửi link đặt lại" → `requestPasswordReset({ email, redirectTo: origin + '/reset-password' })`
- Thành công → `CheckEmailScreen` tiêu đề "Kiểm tra email", nội dung *"Nếu **{email}** có tài khoản, chúng tôi đã gửi link đặt lại mật khẩu. Link còn hiệu lực trong 1 giờ. Hãy kiểm tra hộp thư, cả mục Spam/Quảng cáo, trước khi gửi lại."*, nút Gửi lại (60s), footer "Quay lại đăng nhập" → `/login`
- 429 → `RATE_LIMITED`; khác → `NETWORK`
- Dưới form: "Nhớ mật khẩu rồi? Đăng nhập"

### `/reset-password`

Luồng BE: mail chứa `{BETTER_AUTH_URL}/api/auth/reset-password/:token?callbackURL=...` → BE kiểm tra token → redirect `FE/reset-password?token=...` hoặc `?error=INVALID_TOKEN`.

- `error` hoặc thiếu `token` → khối "Link đặt lại đã hết hạn hoặc không hợp lệ" + nút "Yêu cầu link mới" → `/forgot-password`
- Có `token` → form "Mật khẩu mới" + "Nhập lại mật khẩu", nút ẩn/hiện dùng chung cho cả hai ô, `autoComplete="new-password"`
- Lưu → `resetPassword({ newPassword, token })` → thành công `await authClient.signOut().catch(() => {})` → `router.replace('/login?reset=1')`
- 400 `INVALID_TOKEN` → chuyển sang khối hết hạn
- `PASSWORD_TOO_SHORT` / `PASSWORD_TOO_LONG` → lỗi ở ô mật khẩu; 429 / khác → banner

## 6. Backend

```ts
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  revokeSessionsOnPasswordReset: true,
  sendResetPassword: …,          // giữ nguyên
},
rateLimit: {
  enabled: true,
  storage: 'secondary-storage',
  customRules: {
    '/sign-up/email': { window: 600, max: 3 },
    '/request-password-reset': { window: 600, max: 3 },
  },
},
```

Không cần endpoint mới. OAuth không đổi code; README thêm:

- Google Cloud Console → Authorized redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google`
- GitHub OAuth App → Authorization callback URL: `{BETTER_AUTH_URL}/api/auth/callback/github`
- Điền `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` vào `back-end/.env`
- Prod: `COOKIE_DOMAIN` bắt buộc để FE (`proxy.ts`) thấy cookie session

## 7. Kiểm thử

**BE e2e** — thêm vào `back-end/test/auth.e2e-spec.ts`, dùng mock `mail.sendResetPassword` sẵn có:

8. Tạo + xác minh một user **mới** (user của test 6 đã bị ban), sign-in lấy cookie → `POST /api/auth/request-password-reset` với `redirectTo: FE_URL + '/reset-password'` (phải qua `originCheck`) → `sendResetPassword` được gọi; lấy token từ đoạn path `/reset-password/:token` của URL mock nhận → `POST /api/auth/reset-password` 200 → sign-in mật khẩu mới 200, mật khẩu cũ 401; cookie session cũ gọi `/api/me` → 401
9. Email không tồn tại → 200, `sendResetPassword` không được gọi
10. Gọi `request-password-reset` lần thứ 4 trong 10 phút cùng IP → 429

Test 10 dùng IP/header riêng (như test 7) để không đụng các test khác.

**FE unit** — `node --test`:

- `safe-redirect.test.ts`: `/my-learning` → giữ; `/courses?q=a` → giữ; `//evil.com`, `/\evil.com`, `https://evil.com`, `evil`, `''`, `null`, `undefined` → `/`
- `login-form.schema.test.ts`: email sai → lỗi `email`; mật khẩu rỗng → lỗi `password`; mật khẩu 3 ký tự → **hợp lệ**; email được trim + lowercase
- `reset-password.schema.test.ts`: 7 ký tự → lỗi; 129 → lỗi; không khớp → lỗi `confirmPassword`; hợp lệ → pass
- `register-form.schema.test.ts` cũ vẫn pass

**Thủ công** (Chrome, BE chạy với `back-end/.env`):

1. Đăng nhập đúng → về `/`, header hiện tên/email thật
2. Sai mật khẩu → banner, ô mật khẩu bị xoá
3. Tài khoản chưa xác minh → khối hướng dẫn; bấm gửi lại → khoá 60s, mail tới
4. `/login?redirect=/my-learning` → đăng nhập xong vào `/my-learning`; `?redirect=//evil.com` → về `/`
5. Google/GitHub user mới → `/onboarding`; đăng xuất, đăng nhập lại → `/`
6. Đang đăng nhập mở `/login`, `/register`, `/forgot-password` → bị đưa về `/`
7. Đăng xuất → header hiện Đăng nhập/Đăng ký; mở `/login` được
8. Quên mật khẩu → mail tới → đặt mật khẩu mới → `/login?reset=1` có banner → đăng nhập mật khẩu mới được
9. Mở lại link đặt lại đã dùng → khối hết hạn
10. Đăng nhập ở 2 trình duyệt, đặt lại mật khẩu ở 1 → trình duyệt kia F5 thì header về Đăng nhập
11. Tắt BE → các form hiện lỗi kết nối

**Hồi quy**: FE `tsc --noEmit`, `pnpm lint`, `pnpm build`; BE `pnpm test:e2e` (toàn bộ, gồm test 1–7 cũ).
