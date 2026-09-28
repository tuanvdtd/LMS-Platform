# Đăng nhập + quên/đặt lại mật khẩu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Form `/login` gọi Better Auth thật (email + Google/GitHub, `?redirect=`), header hiện user thật và Đăng xuất thật, `proxy.ts` đẩy user đã đăng nhập khỏi trang auth, thêm `/forgot-password` + `/reset-password`.

**Architecture:** Trình duyệt gọi thẳng back-end qua `authClient` (như trang đăng ký). Schema zod tách file, test bằng `node --test`. Phần dùng chung của các form auth (thông báo lỗi, đếm ngược gửi lại, màn "Kiểm tra email", Field/Banner/nút ẩn hiện mật khẩu) gom vào `src/app/(auth)/_components/`. Back-end chỉ đổi cấu hình Better Auth + thêm e2e.

**Tech Stack:** Next.js 16.3.6 App Router (`proxy.ts`), React 19, better-auth 1.7.6, react-hook-form 7 + zod 4, NestJS 12 + vitest (e2e), Node 24 (`node --test`).

**Spec:** `docs/superpowers/specs/2026-09-28-login-password-reset-design.md`

**Quy định repo:** KHÔNG `git commit` / `git push` ở bất kỳ bước nào. Sếp tự commit. Cuối plan chỉ đề xuất commit message.

Lệnh FE chạy từ `/Users/bssgroup/Personal/Project/it-course-platform`, lệnh BE từ `/Users/bssgroup/Personal/Project/back-end`.

---

## File Structure

| File | Trạng thái | Trách nhiệm |
|---|---|---|
| `back-end/src/auth/auth.ts` | Sửa | `revokeSessionsOnPasswordReset`, rate limit `/request-password-reset` |
| `back-end/test/auth.e2e-spec.ts` | Sửa | Test 8–10 |
| `back-end/README.md` | Sửa | Mục cấu hình OAuth + `COOKIE_DOMAIN` |
| `src/lib/safe-redirect.ts` (+ `.test.ts`) | Tạo | Lọc `?redirect=` chỉ nhận đường dẫn nội bộ |
| `src/proxy.ts` | Tạo | Có cookie session → đẩy khỏi `/login` `/register` `/forgot-password` |
| `src/app/(auth)/_components/auth-fields.schema.ts` | Tạo | `emailField`, `passwordField`, `forgotPasswordSchema` |
| `src/app/(auth)/_components/login-form.schema.ts` (+ `.test.ts`) | Tạo | `loginSchema` |
| `src/app/(auth)/register/_components/register-form.schema.ts` | Sửa | Dùng field chung, hành vi không đổi |
| `src/app/(auth)/reset-password/_components/reset-password.schema.ts` (+ `.test.ts`) | Tạo | `resetPasswordSchema` |
| `src/app/(auth)/_components/auth-messages.ts` | Tạo | `RATE_LIMITED`, `NETWORK`, `RESEND_COOLDOWN`, `fallbackError`, `resendVerification` |
| `src/app/(auth)/_components/use-cooldown.ts` | Tạo | Hook đếm ngược |
| `src/app/(auth)/_components/form-parts.tsx` | Tạo | `Field`, `Banner`, `PasswordToggle` (đang nằm trong register-form, cả 4 form dùng) |
| `src/app/(auth)/_components/check-email-screen.tsx` | Tạo | Màn "Kiểm tra email" dùng chung |
| `src/app/(auth)/register/_components/register-form.tsx` | Sửa | Dùng các phần chung |
| `src/app/(auth)/_components/social-buttons.tsx` | Sửa | Prop `redirect`, 3 callback URL |
| `src/app/(auth)/_components/login-view.tsx` | Sửa | Form đăng nhập thật + khối chưa xác minh |
| `src/app/(auth)/login/page.tsx` | Sửa | Đọc `searchParams` → props |
| `src/components/layout/header.tsx` | Sửa | `useSession` + `signOut` |
| `src/app/(auth)/forgot-password/page.tsx` + `_components/forgot-password-form.tsx` | Tạo | Trang quên mật khẩu |
| `src/app/(auth)/reset-password/page.tsx` + `_components/reset-password-form.tsx` | Tạo | Trang đặt lại mật khẩu |

`form-parts.tsx` không có trong danh sách file của spec — thêm vì `Field`/banner/nút ẩn hiện đang viết trong register-form và sẽ lặp ở 3 form mới.

---

### Task 1: Back-end — revoke session khi reset, rate limit, e2e

**Files:**
- Modify: `back-end/src/auth/auth.ts`
- Modify: `back-end/test/auth.e2e-spec.ts`
- Modify: `back-end/README.md`

- [ ] **Step 1: Viết test 8–10**

Trong `back-end/test/auth.e2e-spec.ts`, thêm helper ngay dưới `verifyPathFor`:

```ts
  const resetTokenFor = async (email: string) => {
    await vi.waitFor(() =>
      expect(mail.sendResetPassword).toHaveBeenCalledWith(email, expect.any(String)),
    );
    const [, url] = mail.sendResetPassword.mock.calls.findLast(
      ([to]) => to === email,
    ) as [string, string];
    // {BETTER_AUTH_URL}/api/auth/reset-password/:token?callbackURL=...
    return new URL(url).pathname.split('/').pop()!;
  };
  const requestReset = (email: string, ip?: string) =>
    call('post', '/api/auth/request-password-reset', { ip }).send({
      email,
      redirectTo: `${FE_URL}/reset-password`,
    });
```

Thêm 3 test cuối `describe`:

```ts
  it('8. đặt lại mật khẩu: mật khẩu mới dùng được, mật khẩu cũ và session cũ mất', async () => {
    // user mới — user của test 1–6 đã bị ban
    const email = randomEmail();
    await signUp(email).expect(200);
    await call('get', await verifyPathFor(email));
    const oldCookie = cookieOf(await signIn(email).expect(200));

    await requestReset(email).expect(200);
    const token = await resetTokenFor(email);
    const NEW_PASSWORD = 'NewPassword456!';
    await call('post', '/api/auth/reset-password')
      .send({ token, newPassword: NEW_PASSWORD })
      .expect(200);

    await call('post', '/api/auth/sign-in/email')
      .send({ email, password: NEW_PASSWORD })
      .expect(200);
    await signIn(email).expect(401);
    await call('get', '/api/me', { cookie: oldCookie }).expect(401);
  });

  it('9. email không tồn tại vẫn 200, không gửi mail', async () => {
    const email = randomEmail();
    await requestReset(email).expect(200);
    await new Promise((r) => setTimeout(r, 200));
    expect(mail.sendResetPassword).not.toHaveBeenCalledWith(email, expect.any(String));
  });

  it('10. request-password-reset quá 3 lần cùng IP thì 429', async () => {
    const ip = randomIp();
    for (let i = 0; i < 3; i++) await requestReset(randomEmail(), ip).expect(200);
    await requestReset(randomEmail(), ip).expect(429);
  });
```

Lưu ý test 10: luật mặc định của Better Auth (3 lần / 60s) cũng cho 429 ở lần thứ 4, nên test này chỉ chốt "có chặn", không phân biệt được 60s hay 600s. Chấp nhận — không chờ 60s trong e2e.

- [ ] **Step 2: Chạy, xác nhận test 8 fail**

Run (từ `back-end/`): `pnpm test:e2e`
Expected: test 1–7, 9, 10 PASS; test 8 FAIL ở dòng `/api/me` với `oldCookie` (nhận 200, mong 401) — chưa bật revoke.

- [ ] **Step 3: Sửa `back-end/src/auth/auth.ts`**

Trong `emailAndPassword`, thêm sau `requireEmailVerification: true,`:

```ts
      // Lộ mật khẩu → đặt lại là đá mọi phiên, kể cả kẻ gian.
      revokeSessionsOnPasswordReset: true,
```

Thay `customRules` trong `rateLimit`:

```ts
      // Mặc định /request-password-reset là 3 lần/60s → ~180 mail/giờ tới hộp thư người khác.
      customRules: {
        '/sign-up/email': { window: 600, max: 3 },
        '/request-password-reset': { window: 600, max: 3 },
      },
```

- [ ] **Step 4: Chạy lại, tất cả pass**

Run: `pnpm test:e2e`
Expected: 10 test PASS.

- [ ] **Step 5: README**

Trong `back-end/README.md`, thêm trước `## Test`:

```markdown
## OAuth Google / GitHub

Provider thiếu key thì back-end bỏ hẳn provider đó (FE hiện "tạm thời chưa khả dụng").

- Google Cloud Console → Credentials → OAuth client (Web application)
  - Authorized JavaScript origins: `FE_URL` (dev `http://localhost:3000`)
  - Authorized redirect URIs: `{BETTER_AUTH_URL}/api/auth/callback/google` (dev `http://localhost:4000/api/auth/callback/google`)
- GitHub → Settings → Developer settings → OAuth Apps
  - Homepage URL: `FE_URL`
  - Authorization callback URL: `{BETTER_AUTH_URL}/api/auth/callback/github`
- Điền `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` vào `.env`, restart.

Prod: bắt buộc `COOKIE_DOMAIN` (vd `.skillpath.dotattuan.id.vn`) — FE (`proxy.ts`) phải đọc được cookie session do back-end set.
```

- [ ] **Step 6: Lint BE**

Run: `pnpm exec tsc --noEmit -p . && pnpm lint`
Expected: không lỗi.

---

### Task 2: `safeRedirect` (TDD)

**Files:**
- Create: `src/lib/safe-redirect.test.ts`
- Create: `src/lib/safe-redirect.ts`

- [ ] **Step 1: Viết test**

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { safeRedirect } from './safe-redirect.ts';

test('giữ đường dẫn nội bộ', () => {
  assert.equal(safeRedirect('/my-learning'), '/my-learning');
  assert.equal(safeRedirect('/courses?q=a'), '/courses?q=a');
});

test('chặn open redirect và giá trị rỗng', () => {
  for (const v of ['//evil.com', '/\\evil.com', 'https://evil.com', 'evil', '', null, undefined]) {
    assert.equal(safeRedirect(v), '/', String(v));
  }
});
```

- [ ] **Step 2: Chạy, xác nhận fail**

Run: `node --test src/lib/safe-redirect.test.ts`
Expected: FAIL — `Cannot find module .../safe-redirect.ts`.

- [ ] **Step 3: Viết code**

```ts
// "//x" và "/\x" trình duyệt hiểu là URL khác domain → chặn.
export function safeRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  return value;
}
```

- [ ] **Step 4: Chạy, pass**

Run: `node --test src/lib/safe-redirect.test.ts`
Expected: `# pass 2`.

---

### Task 3: Schema chung, login, reset (TDD)

**Files:**
- Create: `src/app/(auth)/_components/auth-fields.schema.ts`
- Modify: `src/app/(auth)/register/_components/register-form.schema.ts`
- Create: `src/app/(auth)/_components/login-form.schema.ts`, `login-form.schema.test.ts`
- Create: `src/app/(auth)/reset-password/_components/reset-password.schema.ts`, `reset-password.schema.test.ts`

- [ ] **Step 1: Tách field chung**

`src/app/(auth)/_components/auth-fields.schema.ts`:

```ts
import { z } from 'zod';

// trim/lowercase trước rồi mới kiểm định dạng, để " A@B.com " vẫn hợp lệ
export const emailField = z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ'));

// 8–128 = mặc định minPasswordLength/maxPasswordLength của Better Auth
export const passwordField = z
  .string()
  .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
  .max(128, 'Mật khẩu tối đa 128 ký tự');

export const forgotPasswordSchema = z.object({ email: emailField });
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ForgotPasswordValues = z.output<typeof forgotPasswordSchema>;
```

Trong `register-form.schema.ts`: thêm `import { emailField, passwordField } from '../../_components/auth-fields.schema.ts';`, thay dòng `email: ...` bằng `email: emailField,` và dòng `password: ...` bằng `password: passwordField,` (xoá 2 comment đi kèm vì đã chuyển sang file chung).

- [ ] **Step 2: Test register cũ vẫn pass**

Run: `node --test 'src/app/(auth)/register/_components/register-form.schema.test.ts'`
Expected: `# pass 8`, `# fail 0`.

- [ ] **Step 3: Viết test login + reset**

`src/app/(auth)/_components/login-form.schema.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loginSchema } from './login-form.schema.ts';

const paths = (input: unknown) => {
  const r = loginSchema.safeParse(input);
  assert.equal(r.success, false);
  return r.error!.issues.map((i) => i.path.join('.'));
};

test('email sai → lỗi email', () => {
  assert.deepEqual(paths({ email: 'abc', password: 'x' }), ['email']);
});

test('mật khẩu rỗng → lỗi password', () => {
  assert.deepEqual(paths({ email: 'a@b.com', password: '' }), ['password']);
});

test('mật khẩu ngắn vẫn hợp lệ; email được trim + lowercase', () => {
  const r = loginSchema.parse({ email: ' A@B.com ', password: 'abc' });
  assert.deepEqual(r, { email: 'a@b.com', password: 'abc' });
});
```

`src/app/(auth)/reset-password/_components/reset-password.schema.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resetPasswordSchema } from './reset-password.schema.ts';

const paths = (password: string, confirmPassword: string) => {
  const r = resetPasswordSchema.safeParse({ password, confirmPassword });
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
};

test('7 ký tự → lỗi password', () => {
  assert.ok(paths('1234567', '1234567').includes('password'));
});

test('129 ký tự → lỗi password', () => {
  const p = 'a'.repeat(129);
  assert.ok(paths(p, p).includes('password'));
});

test('nhập lại không khớp → lỗi confirmPassword', () => {
  assert.deepEqual(paths('12345678', '12345679'), ['confirmPassword']);
});

test('hợp lệ', () => {
  assert.deepEqual(paths('12345678', '12345678'), []);
});
```

- [ ] **Step 4: Chạy, xác nhận fail**

Run: `node --test 'src/app/(auth)/_components/login-form.schema.test.ts' 'src/app/(auth)/reset-password/_components/reset-password.schema.test.ts'`
Expected: FAIL — không tìm thấy module schema.

- [ ] **Step 5: Viết schema**

`src/app/(auth)/_components/login-form.schema.ts`:

```ts
import { z } from 'zod';
import { emailField } from './auth-fields.schema.ts';

// Không áp 8–128 khi đăng nhập: sai thì luôn là "email hoặc mật khẩu không đúng"
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;
```

`src/app/(auth)/reset-password/_components/reset-password.schema.ts`:

```ts
import { z } from 'zod';
import { passwordField } from '../../_components/auth-fields.schema.ts';

export const resetPasswordSchema = z
  .object({ password: passwordField, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp',
  });

export type ResetPasswordValues = z.output<typeof resetPasswordSchema>;
```

- [ ] **Step 6: Chạy, pass**

Run: lệnh ở Step 4
Expected: `# pass 7`, `# fail 0`.

---

### Task 4: Phần dùng chung + refactor RegisterForm

**Files:**
- Create: `src/app/(auth)/_components/auth-messages.ts`
- Create: `src/app/(auth)/_components/use-cooldown.ts`
- Create: `src/app/(auth)/_components/form-parts.tsx`
- Create: `src/app/(auth)/_components/check-email-screen.tsx`
- Modify: `src/app/(auth)/register/_components/register-form.tsx`

- [ ] **Step 1: `auth-messages.ts`**

```ts
import { authClient } from '@/lib/auth-client';

export const RATE_LIMITED = 'Bạn thử quá nhiều lần, vui lòng đợi vài phút';
export const NETWORK = 'Không kết nối được máy chủ, thử lại sau';
// Khớp rate limit mặc định của Better Auth cho /send-verification-email (3 lần/60s)
export const RESEND_COOLDOWN = 60;

export const fallbackError = (status?: number) => (status === 429 ? RATE_LIMITED : NETWORK);

// Bấm link xác minh → back-end autoSignInAfterVerification → về onboarding
export async function resendVerification(email: string): Promise<string | null> {
  try {
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: `${window.location.origin}/onboarding`,
    });
    return error ? fallbackError(error.status) : null;
  } catch {
    return NETWORK;
  }
}
```

- [ ] **Step 2: `use-cooldown.ts`**

```ts
import { useEffect, useState } from 'react';
import { RESEND_COOLDOWN } from './auth-messages';

/** Đếm ngược từng giây về 0; restart() khoá lại RESEND_COOLDOWN giây. */
export function useCooldown(initial = 0) {
  const [cooldown, setCooldown] = useState(initial);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  return { cooldown, restart: () => setCooldown(RESEND_COOLDOWN) };
}
```

- [ ] **Step 3: `form-parts.tsx`**

Chuyển `Field` và khối banner đỏ từ `register-form.tsx`, thêm biến thể xanh và nút ẩn/hiện:

```tsx
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function Banner({ tone = 'error', children }: { tone?: 'error' | 'success'; children: React.ReactNode }) {
  const color = tone === 'error' ? 'var(--destructive)' : 'var(--success, #16a34a)';
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className="rounded-lg border px-3 py-2 text-sm"
      style={{ color, borderColor: color, background: `color-mix(in srgb, ${color} 8%, transparent)` }}
    >
      {children}
    </div>
  );
}

export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="absolute right-0 top-1/2 -translate-y-1/2"
      aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
    >
      {shown ? <EyeOff size={15} style={{ color: 'var(--muted-foreground)' }} /> : <Eye size={15} style={{ color: 'var(--muted-foreground)' }} />}
    </Button>
  );
}
```

Kiểm tra `globals.css` có biến `--success` không (`grep -n "\-\-success" src/app/globals.css`); có thì bỏ fallback `, #16a34a`.

- [ ] **Step 4: `check-email-screen.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthShell } from './auth-shell';
import { RESEND_COOLDOWN } from './auth-messages';
import { useCooldown } from './use-cooldown';

type Props = {
  title: string;
  children: React.ReactNode;
  /** Trả câu lỗi để hiển thị, hoặc null nếu gửi được. */
  onResend: () => Promise<string | null>;
  footer: React.ReactNode;
};

export function CheckEmailScreen({ title, children, onResend, footer }: Props) {
  // Bắt đầu đã khoá: mail vừa được gửi
  const { cooldown, restart } = useCooldown(RESEND_COOLDOWN);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setError(null);
    restart();
    setError(await onResend());
  }

  return (
    <AuthShell title={title}>
      <div className="text-center space-y-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-7" />
        </div>
        {children}
        <Button variant="outline" className="w-full" disabled={cooldown > 0} onClick={resend}>
          {cooldown > 0 ? `Gửi lại email (${cooldown}s)` : 'Gửi lại email'}
        </Button>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        {footer}
      </div>
    </AuthShell>
  );
}
```

- [ ] **Step 5: Refactor `register-form.tsx`**

- Xoá hằng `RESEND_COOLDOWN`, `RATE_LIMITED`, `NETWORK`, hàm `callbackURL`, component `Field` và `SentScreen`
- Import:
  ```ts
  import { Loader2 } from 'lucide-react';
  import { CheckEmailScreen } from '../../_components/check-email-screen';
  import { Banner, Field, PasswordToggle } from '../../_components/form-parts';
  import { fallbackError, NETWORK, resendVerification } from '../../_components/auth-messages';
  ```
  (bỏ `useEffect`, `Eye`, `EyeOff`, `MailCheck` khỏi import)
- Trong `signUp.email`: `callbackURL: \`${window.location.origin}/onboarding\``
- `else setBanner(error.status === 429 ? RATE_LIMITED : NETWORK);` → `else setBanner(fallbackError(error.status));`
- Khối banner `<div role="alert" …>{banner}</div>` → `<Banner>{banner}</Banner>`
- Nút ẩn/hiện trong ô mật khẩu → `<PasswordToggle shown={showPw} onToggle={() => setShowPw((p) => !p)} />`
- Thay `<SentScreen email={sentTo} onBack={…} />` bằng:

```tsx
      <CheckEmailScreen
        title="Kiểm tra email"
        onResend={() => resendVerification(sentTo)}
        footer={
          <Button
            variant="link"
            onClick={() => {
              // useForm vẫn giữ name/email khi form unmount (shouldUnregister mặc định false)
              resetField('password');
              resetField('confirmPassword');
              setSentTo(null);
            }}
          >
            Dùng email khác
          </Button>
        }
      >
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          Chúng tôi đã gửi link xác minh tới <strong>{sentTo}</strong>.
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Link hết hạn sau 24 giờ. Nếu email này đã có tài khoản, hãy{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">đăng nhập</Link>.
        </p>
      </CheckEmailScreen>
```

- [ ] **Step 6: Typecheck + lint**

Run: `pnpm exec tsc --noEmit -p . && pnpm exec eslint 'src/app/(auth)'`
Expected: không lỗi.

---

### Task 5: SocialButtons + LoginView + login page

**Files:**
- Modify: `src/app/(auth)/_components/social-buttons.tsx`
- Modify: `src/app/(auth)/_components/login-view.tsx`
- Modify: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: SocialButtons nhận `redirect`**

- Import `import { safeRedirect } from '@/lib/safe-redirect';` và `import { NETWORK } from './auth-messages';`
- `export function SocialButtons({ redirect }: { redirect?: string }) {`
- Thay lệnh gọi:

```ts
      const origin = window.location.origin;
      // Thành công → better-auth tự redirect sang trang của provider
      const { error } = await authClient.signIn.social({
        provider: id,
        callbackURL: origin + safeRedirect(redirect),
        newUserCallbackURL: `${origin}/onboarding`,
        // Lỗi OAuth → back-end redirect về đây kèm ?error=...
        errorCallbackURL: `${origin}/login`,
      });
```

- `setError('Không kết nối được máy chủ, thử lại sau')` → `setError(NETWORK)`

- [ ] **Step 2: Viết lại `login-view.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Btn } from '@/components/shared/product-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { safeRedirect } from '@/lib/safe-redirect';
import { AuthShell } from './auth-shell';
import { fallbackError, NETWORK, resendVerification } from './auth-messages';
import { Banner, Field, PasswordToggle } from './form-parts';
import { loginSchema, type LoginInput, type LoginValues } from './login-form.schema';
import { SocialButtons } from './social-buttons';
import { useCooldown } from './use-cooldown';

const INVALID = 'Email hoặc mật khẩu không đúng';
const OAUTH_FAILED = 'Đăng nhập bằng Google/GitHub không thành công, vui lòng thử lại';

type Props = { redirect?: string; reset?: boolean; oauthError?: boolean };

export function LoginView({ redirect, reset, oauthError }: Props) {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [banner, setBanner] = useState<string | null>(oauthError ? OAUTH_FAILED : null);
  const [showReset, setShowReset] = useState(!!reset);
  const [unverified, setUnverified] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginValues) {
    setBanner(null);
    setShowReset(false);
    setUnverified(null);
    try {
      const { error } = await authClient.signIn.email(values);
      if (!error) {
        router.replace(safeRedirect(redirect));
        router.refresh();
        return;
      }
      if (error.code === 'EMAIL_NOT_VERIFIED') setUnverified(values.email);
      else if (error.code === 'INVALID_EMAIL_OR_PASSWORD') {
        resetField('password');
        setBanner(INVALID);
      } else setBanner(fallbackError(error.status));
    } catch {
      setBanner(NETWORK);
    }
  }

  const describedBy = (field: keyof LoginInput) => (errors[field] ? `${field}-error` : undefined);

  return (
    <AuthShell title="Đăng nhập">
      <SocialButtons redirect={redirect} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {showReset && <Banner tone="success">Đổi mật khẩu thành công, hãy đăng nhập lại</Banner>}

        <Field id="email" label="Email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="ten@email.com" aria-invalid={!!errors.email} aria-describedby={describedBy('email')} {...register('email')} />
        </Field>

        <Field id="password" label="Mật khẩu" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-10"
              aria-invalid={!!errors.password}
              aria-describedby={describedBy('password')}
              {...register('password')}
            />
            <PasswordToggle shown={showPw} onToggle={() => setShowPw((p) => !p)} />
          </div>
          <div className="flex justify-end mt-1">
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Quên mật khẩu?</Link>
          </div>
        </Field>

        {banner && <Banner>{banner}</Banner>}
        {unverified && <UnverifiedNotice email={unverified} />}

        <Btn variant="primary" size="lg" type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </Btn>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>
        Chưa có tài khoản?{' '}
        <Link href="/register" className="text-blue-600 font-semibold hover:underline">Đăng ký miễn phí</Link>
      </p>
    </AuthShell>
  );
}

function UnverifiedNotice({ email }: { email: string }) {
  // Lần đầu không khoá: mail xác minh gửi lúc đăng ký, có thể đã lâu
  const { cooldown, restart } = useCooldown();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function resend() {
    setResult(null);
    restart();
    const error = await resendVerification(email);
    setResult(error ? { ok: false, text: error } : { ok: true, text: `Đã gửi lại tới ${email}` });
  }

  return (
    <div role="alert" className="rounded-lg border px-3 py-3 text-sm space-y-2" style={{ borderColor: 'var(--border)' }}>
      <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Email chưa được xác minh</p>
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Link xác minh đã được gửi khi bạn đăng ký và còn hiệu lực 24 giờ. Hãy kiểm tra hộp thư, cả mục
        Spam/Quảng cáo, trước khi gửi lại.
      </p>
      <Button type="button" variant="outline" size="sm" className="w-full" disabled={cooldown > 0} onClick={resend}>
        {cooldown > 0 ? `Gửi lại email xác minh (${cooldown}s)` : 'Gửi lại email xác minh'}
      </Button>
      {result && <p className={`text-xs ${result.ok ? 'text-green-600' : 'text-destructive'}`}>{result.text}</p>}
    </div>
  );
}
```

- [ ] **Step 3: `login/page.tsx` đọc `searchParams`**

```tsx
import type { Metadata } from 'next';
import { LoginView } from '../_components/login-view';

export const metadata: Metadata = { title: 'Đăng nhập | SkillPath' };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Next 16: searchParams là Promise
export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { redirect, reset, error } = await searchParams;
  return <LoginView redirect={first(redirect)} reset={first(reset) === '1'} oauthError={!!first(error)} />;
}
```

Nếu tsc báo không có `PageProps<'/login'>` (type sinh bởi `next dev`/`next typegen`), chạy `pnpm exec next typegen` rồi chạy lại tsc.

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm exec tsc --noEmit -p . && pnpm exec eslint 'src/app/(auth)'`
Expected: không lỗi.

---

### Task 6: `proxy.ts`

**Files:**
- Create: `src/proxy.ts`

- [ ] **Step 1: Viết proxy**

```ts
import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';
import { safeRedirect } from '@/lib/safe-redirect';

// Chỉ kiểm tra có cookie (lạc quan, không gọi back-end). Cookie hỏng → header
// gọi useSession, back-end xoá cookie, user vào lại /login được.
// Prod cần COOKIE_DOMAIN để FE đọc được cookie do back-end set.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) return NextResponse.next();
  const to = safeRedirect(request.nextUrl.searchParams.get('redirect'));
  return NextResponse.redirect(new URL(to, request.url));
}

// Không có /reset-password: user đang đăng nhập vẫn bấm được link đặt lại
export const config = { matcher: ['/login', '/register', '/forgot-password'] };
```

- [ ] **Step 2: Typecheck + build**

Run: `pnpm exec tsc --noEmit -p . && pnpm build`
Expected: build thành công, output có dòng `ƒ Proxy (Middleware)` (hoặc tương đương).

---

### Task 7: Header theo session

**Files:**
- Modify: `src/components/layout/header.tsx`

- [ ] **Step 1: Sửa header**

- Xoá `import { demoStudent } from '@/lib/mocks/data';`, thêm `import { authClient } from '@/lib/auth-client';`
- Trong component, sau `const { resolvedTheme, setTheme } = useTheme();`:

```ts
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  async function signOut() {
    await authClient.signOut();
    router.replace('/');
    router.refresh();
  }
```

- Bọc 2 link Tin nhắn + Thông báo trong `{user && (<> … </>)}` (giỏ hàng giữ nguyên)
- Thay toàn bộ khối `{/* Profile */}` `<DropdownMenu>…</DropdownMenu>` bằng:

```tsx
          {/* Profile */}
          {isPending ? (
            <div className="size-9 flex items-center justify-center">
              <div className="size-7 rounded-full animate-pulse" style={{ background: 'var(--secondary)' }} />
            </div>
          ) : !user ? (
            <div className="flex items-center gap-1 ml-1">
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Đăng nhập</Link>
              <Link href="/register" className={buttonVariants({ size: 'sm' })}>Đăng ký</Link>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu tài khoản" />}
              >
                <Avatar className="size-7">
                  {user.image && <AvatarImage src={user.image} alt={user.name} />}
                  <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <p className="text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                {/* …giữ nguyên DropdownMenuSeparator, danh sách link, "Chuyển sang Giảng viên"… */}
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={signOut}>
                  <LogOut size={15} />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
```

Phần "giữ nguyên" là copy nguyên các dòng hiện có từ `<DropdownMenuSeparator />` sau label tới hết item "Chuyển sang Giảng viên". Chỉ item Đăng xuất được thêm `onClick={signOut}`.

Import thêm `buttonVariants`: `import { Button, buttonVariants } from '@/components/ui/button';`. Dùng `Link` + `buttonVariants` thay `<Button render={<Link/>}>` — Base UI 1.8 bắt buộc `nativeButton={false}` khi render ra thẻ không phải `<button>`, dễ quên.

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm exec tsc --noEmit -p . && pnpm exec eslint src/components/layout/header.tsx`
Expected: không lỗi. `demoStudent` có thể vẫn được dùng ở file khác — không xoá khỏi mocks.

---

### Task 8: `/forgot-password`

**Files:**
- Create: `src/app/(auth)/forgot-password/page.tsx`
- Create: `src/app/(auth)/forgot-password/_components/forgot-password-form.tsx`

- [ ] **Step 1: Form**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Btn } from '@/components/shared/product-ui';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { AuthShell } from '../../_components/auth-shell';
import { fallbackError, NETWORK } from '../../_components/auth-messages';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
  type ForgotPasswordValues,
} from '../../_components/auth-fields.schema';
import { CheckEmailScreen } from '../../_components/check-email-screen';
import { Banner, Field } from '../../_components/form-parts';

// Email không tồn tại cũng trả 200 → không lộ tài khoản
async function requestReset(email: string): Promise<string | null> {
  try {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? fallbackError(error.status) : null;
  } catch {
    return NETWORK;
  }
}

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput, unknown, ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  async function onSubmit({ email }: ForgotPasswordValues) {
    setBanner(null);
    const error = await requestReset(email);
    if (error) setBanner(error);
    else setSentTo(email);
  }

  if (sentTo) {
    return (
      <CheckEmailScreen
        title="Kiểm tra email"
        onResend={() => requestReset(sentTo)}
        footer={<Link href="/login" className="block text-sm text-blue-600 hover:underline">Quay lại đăng nhập</Link>}
      >
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          Nếu <strong>{sentTo}</strong> có tài khoản, chúng tôi đã gửi link đặt lại mật khẩu.
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Link còn hiệu lực trong 1 giờ. Hãy kiểm tra hộp thư, cả mục Spam/Quảng cáo, trước khi gửi lại.
        </p>
      </CheckEmailScreen>
    );
  }

  return (
    <AuthShell title="Quên mật khẩu">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Nhập email đã đăng ký, chúng tôi sẽ gửi link để bạn đặt mật khẩu mới.
        </p>
        <Field id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="ten@email.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
        </Field>
        {banner && <Banner>{banner}</Banner>}
        <Btn variant="primary" size="lg" type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang gửi...
            </>
          ) : (
            'Gửi link đặt lại'
          )}
        </Btn>
      </form>
      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>
        Nhớ mật khẩu rồi?{' '}
        <Link href="/login" className="text-blue-600 font-semibold hover:underline">Đăng nhập</Link>
      </p>
    </AuthShell>
  );
}
```

- [ ] **Step 2: Page**

```tsx
import type { Metadata } from 'next';
import { ForgotPasswordForm } from './_components/forgot-password-form';

export const metadata: Metadata = { title: 'Quên mật khẩu | SkillPath' };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm exec tsc --noEmit -p . && pnpm exec eslint 'src/app/(auth)'`
Expected: không lỗi.

---

### Task 9: `/reset-password`

**Files:**
- Create: `src/app/(auth)/reset-password/page.tsx`
- Create: `src/app/(auth)/reset-password/_components/reset-password-form.tsx`

- [ ] **Step 1: Form**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Btn } from '@/components/shared/product-ui';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { AuthShell } from '../../_components/auth-shell';
import { fallbackError, NETWORK } from '../../_components/auth-messages';
import { Banner, Field, PasswordToggle } from '../../_components/form-parts';
import { resetPasswordSchema, type ResetPasswordValues } from './reset-password.schema';

const FIELD_ERRORS: Record<string, string> = {
  PASSWORD_TOO_SHORT: 'Mật khẩu cần ít nhất 8 ký tự',
  PASSWORD_TOO_LONG: 'Mật khẩu tối đa 128 ký tự',
};

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [expired, setExpired] = useState(!token);
  const [banner, setBanner] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit({ password }: ResetPasswordValues) {
    setBanner(null);
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
      if (!error) {
        // BE đã thu hồi session nhưng trình duyệt còn cookie → proxy sẽ đẩy khỏi /login
        await authClient.signOut().catch(() => {});
        router.replace('/login?reset=1');
        return;
      }
      if (error.code === 'INVALID_TOKEN') setExpired(true);
      else if (error.code && FIELD_ERRORS[error.code]) setError('password', { message: FIELD_ERRORS[error.code] });
      else setBanner(fallbackError(error.status));
    } catch {
      setBanner(NETWORK);
    }
  }

  if (expired) {
    return (
      <AuthShell title="Link không hợp lệ">
        <div className="text-center space-y-4">
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            Link đặt lại đã hết hạn hoặc không hợp lệ.
          </p>
          <Btn variant="primary" size="lg" className="w-full" onClick={() => router.push('/forgot-password')}>
            Yêu cầu link mới
          </Btn>
          <Link href="/login" className="block text-sm text-blue-600 hover:underline">Quay lại đăng nhập</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Đặt mật khẩu mới">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field id="password" label="Mật khẩu mới" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Ít nhất 8 ký tự"
              className="pr-10"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            <PasswordToggle shown={showPw} onToggle={() => setShowPw((p) => !p)} />
          </div>
        </Field>
        <Field id="confirmPassword" label="Nhập lại mật khẩu" error={errors.confirmPassword?.message}>
          <Input
            id="confirmPassword"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            {...register('confirmPassword')}
          />
        </Field>
        {banner && <Banner>{banner}</Banner>}
        <Btn variant="primary" size="lg" type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang lưu...
            </>
          ) : (
            'Lưu mật khẩu mới'
          )}
        </Btn>
      </form>
    </AuthShell>
  );
}
```

Nếu `Btn` không nhận `onClick` (kiểm tra `src/components/shared/product-ui.tsx`), dùng `<Link href="/forgot-password" className="…">` thay nút.

- [ ] **Step 2: Page**

```tsx
import type { Metadata } from 'next';
import { ResetPasswordForm } from './_components/reset-password-form';

export const metadata: Metadata = { title: 'Đặt lại mật khẩu | SkillPath' };

// Back-end redirect về đây kèm ?token=... hoặc ?error=INVALID_TOKEN
export default async function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  const { token, error } = await searchParams;
  const t = typeof token === 'string' && !error ? token : null;
  return <ResetPasswordForm token={t} />;
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm exec next typegen && pnpm exec tsc --noEmit -p . && pnpm exec eslint 'src/app/(auth)'`
Expected: không lỗi. `typegen` cần chạy trước vì `/reset-password` là route mới, chưa có trong type `PageProps`.

---

### Task 10: Kiểm tra toàn bộ

- [ ] **Step 1: Tự động + hồi quy**

FE:
```bash
node --test src/lib/safe-redirect.test.ts 'src/app/(auth)/_components/login-form.schema.test.ts' 'src/app/(auth)/reset-password/_components/reset-password.schema.test.ts' 'src/app/(auth)/register/_components/register-form.schema.test.ts'
pnpm exec tsc --noEmit -p .
pnpm lint
pnpm build
```
Expected: `# pass 17`, `# fail 0`; tsc/lint sạch; build có `/login`, `/register`, `/forgot-password`, `/reset-password` và Proxy.

BE: `pnpm test:e2e` → 10 PASS; `pnpm lint` sạch.

- [ ] **Step 2: Chạy app**

```bash
# terminal 1 — back-end
pnpm start:dev
# terminal 2 — it-course-platform
pnpm dev
```

- [ ] **Step 3: Checklist thủ công (Chrome)**

Rate limit: sign-in 3 lần/10s, gửi lại xác minh 3 lần/60s, quên mật khẩu 3 lần/10 phút.

1. Đăng nhập đúng → về `/`, header hiện tên/email thật
2. Sai mật khẩu → banner "Email hoặc mật khẩu không đúng", ô mật khẩu trống
3. Tài khoản chưa xác minh → khối hướng dẫn; bấm gửi lại → khoá 60s, "Đã gửi lại tới …", mail tới
4. `/login?redirect=/my-learning` → đăng nhập xong vào `/my-learning`; `?redirect=//evil.com` → về `/`
5. Google/GitHub (đã điền key) user mới → `/onboarding`; đăng xuất, đăng nhập lại → `/`
6. Đang đăng nhập mở `/login`, `/register`, `/forgot-password` → bị đưa về `/`; `/login?redirect=/login` → về `/` (không lặp vô hạn)
7. Đăng xuất → header hiện Đăng nhập/Đăng ký, ẩn tin nhắn/thông báo; mở `/login` được
8. Quên mật khẩu → màn Kiểm tra email → mail tới → đặt mật khẩu mới → `/login?reset=1` có banner xanh → đăng nhập mật khẩu mới được
9. Mở lại link đặt lại đã dùng → khối "Link không hợp lệ"
10. Đăng nhập ở 2 trình duyệt, đặt lại mật khẩu ở 1 → trình duyệt kia F5 thì header về Đăng nhập
11. Đang đăng nhập, bấm link đặt lại trong mail → đặt xong vẫn thấy banner xanh ở `/login` (không bị proxy đẩy về `/`)
12. Tắt BE → các form hiện "Không kết nối được máy chủ…"
13. `/register` vẫn chạy như cũ (đăng ký → màn Kiểm tra email → Dùng email khác)

- [ ] **Step 4: Đề xuất commit cho sếp (KHÔNG tự commit)**

```
feat: đăng nhập email/OAuth, header theo session, quên/đặt lại mật khẩu

- Form /login gọi Better Auth, hỗ trợ ?redirect= (chống open redirect)
- Chưa xác minh email: hướng dẫn + gửi lại (cooldown 60s)
- Google/GitHub: user mới → /onboarding, lỗi OAuth → banner
- proxy.ts: đã đăng nhập thì không vào /login /register /forgot-password
- Header: user thật + Đăng xuất
- /forgot-password, /reset-password
- BE: revokeSessionsOnPasswordReset, rate limit request-password-reset 3/10 phút, e2e 8–10
- Tách phần dùng chung của các form auth
```
