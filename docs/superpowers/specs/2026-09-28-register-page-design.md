# Trang đăng ký (/register) — frontend nối Better Auth

- Ngày: 2026-09-28
- Phạm vi: `it-course-platform/`
- Liên quan: `docs/superpowers/specs/2026-09-28-auth-better-auth-design.md` (backend, mục "UI frontend" để ngoài phạm vi — spec này lấp phần đăng ký)

## 1. Mục tiêu

Hiện `/register` render lại `LoginView` (bản mẫu không có form đăng ký). Làm trang đăng ký thật, gọi Better Auth ở back-end.

**Trong phạm vi**

- Form đăng ký email + mật khẩu, validate phía client
- Gọi `signUp.email` tới back-end, xử lý lỗi server
- Màn "Kiểm tra email" sau khi đăng ký, có gửi lại email xác minh
- Nút Google / GitHub gọi `signIn.social` thật (dùng chung cho trang login)
- Tách khung trang auth dùng chung cho login + register

**Ngoài phạm vi**

- Đăng nhập email thật — form login vẫn mock (chỉ 2 nút OAuth trên login thành thật vì dùng chung component)
- Trang `/forgot-password`
- Lưu `targetTrack` / `level` — không hỏi lúc đăng ký; onboarding lưu ở spec sau (sau khi user đã xác minh + đăng nhập)
- Middleware / bảo vệ route theo session

## 2. Quyết định

| Quyết định | Lý do |
|---|---|
| Trình duyệt gọi thẳng back-end bằng `better-auth/react` | Back-end đã `enableCors({ origin: FE_URL, credentials: true })` và cookie theo subdomain (spec back-end §4). Không thêm lớp trung gian |
| Không dùng Next rewrite `/api/auth/*` | Tạo 2 đường vào auth, dễ lệch cấu hình cookie khi deploy. Chưa cần |
| Không dùng Server Action | Cookie session sẽ nằm ở response của Next server, phải tự forward; OAuth vẫn phải chạy client |
| Không báo "email đã tồn tại" | Back-end bật `requireEmailVerification` → Better Auth 1.7.6 trả **200 giả** cho email trùng (chống dò tài khoản, không gửi mail). FE không phân biệt được, nên màn Kiểm tra email phải phủ trường hợp này bằng lời nhắc |
| `callbackURL` = `${FE_URL}/onboarding` | Back-end bật `autoSignInAfterVerification` → bấm link xác minh là đăng nhập luôn, đi thẳng vào onboarding |
| Test schema bằng `node --test` | FE chưa có test runner; Node 24 chạy `.ts` trực tiếp, không thêm dependency. Node yêu cầu import có đuôi (`./register-form.schema.ts`) → bật `allowImportingTsExtensions: true` trong `tsconfig.json` (hợp lệ vì đã `noEmit`). Schema chỉ dùng cú pháp Node strip được: không `enum`, không alias `@/` |
| Checkbox điều khoản dùng `<input type="checkbox">` gốc | Chưa có component checkbox; không thêm cho một chỗ dùng |

## 3. Cấu trúc

```
it-course-platform/
├── .env.example                                   NEXT_PUBLIC_API_URL=http://localhost:4000
└── src/
    ├── lib/auth-client.ts                         createAuthClient({ baseURL: NEXT_PUBLIC_API_URL })
    │                                              + inferAdditionalFields({ targetTrack, level: string, optional })
    └── app/(auth)/
        ├── _components/
        │   ├── auth-shell.tsx                     logo + căn giữa + Card(title) — tách từ login-view
        │   ├── social-buttons.tsx                 'use client'; Google/GitHub → signIn.social; tự hiện banner lỗi
        │   └── login-view.tsx                     dùng AuthShell + SocialButtons; form email vẫn mock
        └── register/
            ├── page.tsx                           server: metadata; <RegisterForm />
            └── _components/
                ├── register-form.tsx              'use client'; form ↔ màn Kiểm tra email
                ├── register-form.schema.ts        zod schema + type RegisterValues (chỉ import zod)
                └── register-form.schema.test.ts   node --test
```

`auth-client.ts` đọc `process.env.NEXT_PUBLIC_API_URL`; thiếu biến → ném lỗi rõ ràng lúc import (không âm thầm gọi sai host). FE URL cho `callbackURL` lấy từ `window.location.origin` lúc gọi (không cần thêm env).

## 4. Form

| Trường | Rule (zod) | Gửi lên |
|---|---|---|
| Họ tên | `trim`, 2–50 ký tự | `name` |
| Email | `trim`, `toLowerCase`, `z.email()` | `email` |
| Mật khẩu | 8–128 ký tự (khớp mặc định Better Auth) | `password` |
| Nhập lại mật khẩu | `refine` bằng mật khẩu, lỗi gắn ở ô này | không |
| Đồng ý điều khoản | phải `true` | không |

- react-hook-form + `zodResolver`, `mode: 'onTouched'`
- Lỗi hiển thị dưới từng ô, ô lỗi có `aria-invalid` + `aria-describedby` trỏ tới dòng lỗi; `<label htmlFor>` cho mọi ô
- Mật khẩu có nút ẩn/hiện (như login)
- Đang submit: nút disable + spinner "Đang tạo tài khoản..."
- Dưới form: "Đã có tài khoản? Đăng nhập" → `/login`
- Style bám theo `login-view.tsx` hiện có (cùng AuthShell, Input, Btn, màu `var(--…)`)

## 5. Luồng dữ liệu

```
submit → authClient.signUp.email({ name, email, password, callbackURL })
  ├─ ok (kể cả 200 giả)  → state = { step: 'sent', email }
  └─ error               → map lỗi (mục 6), ở lại form

màn 'sent':
  Gửi lại → authClient.sendVerificationEmail({ email, callbackURL }) → khoá nút 60s (đếm ngược)
  Dùng email khác → quay lại form, giữ name/email, xoá password + confirm

social → authClient.signIn.social({ provider, callbackURL }) → trình duyệt redirect sang provider
```

## 6. Xử lý lỗi

| Tình huống | Back-end | FE |
|---|---|---|
| Quá 3 lần / 10 phút | 429 | Banner "Bạn thử quá nhiều lần, vui lòng đợi vài phút" |
| Email / mật khẩu không hợp lệ lọt qua zod | 400, code `INVALID_EMAIL` / `PASSWORD_TOO_SHORT` / `PASSWORD_TOO_LONG` / `INVALID_PASSWORD` | `setError` vào đúng ô |
| Mạng lỗi, back-end chết, 5xx, code lạ | fetch lỗi / 5xx | Banner "Không kết nối được máy chủ, thử lại sau" |
| OAuth provider chưa cấu hình | 404 `PROVIDER_NOT_FOUND` từ `signIn.social` | Banner trong SocialButtons "Tiếp tục với {Google/GitHub} tạm thời chưa khả dụng" (chữ trung tính vì login dùng chung) |
| Gửi lại email lỗi | 429 / lỗi khác | Dòng lỗi dưới nút Gửi lại, vẫn khoá 60s |

Banner: `role="alert"`, đặt trên nút submit; giữ nguyên dữ liệu đã nhập.

Màn Kiểm tra email: icon mail, "Chúng tôi đã gửi link xác minh tới **{email}**", "Link hết hạn sau 24 giờ", "Nếu email này đã có tài khoản, hãy [đăng nhập](/login)", nút Gửi lại, link Dùng email khác.

## 7. Kiểm thử

**Tự động** — `node --test 'src/app/(auth)/register/_components/register-form.schema.test.ts'` (cảnh báo "Reparsing as ES module" là vô hại):

- tên < 2 ký tự sau trim → lỗi ở `name`
- email sai định dạng → lỗi ở `email`
- mật khẩu 7 ký tự → lỗi; 129 ký tự → lỗi
- nhập lại không khớp → lỗi ở `confirmPassword`
- chưa tích điều khoản → lỗi ở `acceptTerms`
- dữ liệu hợp lệ → pass, `email` đã lowercase + trim, `name` đã trim

**Thủ công** (Chrome, back-end chạy với `back-end/.env`):

1. Email mới → màn Kiểm tra email; mail Brevo tới
2. Bấm link trong mail → đã đăng nhập, ở `/onboarding`
3. Đăng ký lại cùng email → vẫn màn Kiểm tra email (không lộ tồn tại)
4. Submit lần thứ 4 trong 10 phút → banner 429 (bước 1 và 3 đã tính vào 3 lượt/10 phút — đếm cả chúng, hoặc chạy bước này riêng sau khi hết cửa sổ)
5. Tắt back-end → banner lỗi kết nối
6. Google khi chưa có key → banner "chưa khả dụng"
7. Gửi lại → nút khoá 60s, đếm ngược
8. `/login` vẫn hiển thị như cũ

**Hồi quy**: `tsc --noEmit`, `pnpm lint`, `pnpm build` sạch.
