# Trang đăng ký (/register) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay `/register` (đang render lại `LoginView`) bằng form đăng ký thật gọi Better Auth ở back-end, có màn "Kiểm tra email" + gửi lại, và nút Google/GitHub thật.

**Architecture:** Trình duyệt gọi thẳng back-end (`http://localhost:4000/api/auth/*`) qua `authClient` của `better-auth/react`. Form là client component dùng react-hook-form + zod; schema tách file riêng, test bằng `node --test`. Khung trang (logo + Card) và 2 nút OAuth tách thành component dùng chung cho login + register.

**Tech Stack:** Next.js 16 App Router, React 19, better-auth 1.7.6 (client), react-hook-form 7 + @hookform/resolvers 5, zod 4, shadcn Base UI, Node 24 (`node --test`).

**Spec:** `docs/superpowers/specs/2026-09-28-register-page-design.md`

**Quy định repo:** KHÔNG `git commit` / `git push` ở bất kỳ bước nào. Sếp tự commit. Cuối plan chỉ đề xuất commit message.

Mọi lệnh chạy từ `/Users/bssgroup/Personal/Project/it-course-platform` trừ khi ghi khác.

---

## File Structure

| File | Trạng thái | Trách nhiệm |
|---|---|---|
| `.gitignore` | Sửa | Cho phép track `.env.example` (hiện `.env*` chặn hết) |
| `.env.example` | Tạo | Khai báo `NEXT_PUBLIC_API_URL` |
| `.env.local` | Tạo (không track) | Giá trị dev |
| `tsconfig.json` | Sửa | `allowImportingTsExtensions: true` để test import `./x.ts` |
| `src/lib/auth-client.ts` | Tạo | `authClient` duy nhất của FE |
| `src/app/(auth)/_components/auth-shell.tsx` | Tạo | Logo + căn giữa + Card(title) |
| `src/app/(auth)/_components/social-buttons.tsx` | Tạo | Nút Google/GitHub + banner lỗi + divider "hoặc" |
| `src/app/(auth)/_components/login-view.tsx` | Sửa | Dùng AuthShell + SocialButtons; form email vẫn mock |
| `src/app/(auth)/register/_components/register-form.schema.ts` | Tạo | zod schema + types |
| `src/app/(auth)/register/_components/register-form.schema.test.ts` | Tạo | Test schema |
| `src/app/(auth)/register/_components/register-form.tsx` | Tạo | Form + màn Kiểm tra email |
| `src/app/(auth)/register/page.tsx` | Sửa | Render `RegisterForm` |

---

### Task 1: Env, tsconfig, auth client

**Files:**
- Modify: `.gitignore:33-34`
- Create: `.env.example`, `.env.local`
- Modify: `tsconfig.json`
- Create: `src/lib/auth-client.ts`

- [ ] **Step 1: Cho phép track `.env.example`**

Trong `.gitignore`, ngay dưới dòng `.env*` (dòng 34), thêm:

```gitignore
!.env.example
```

- [ ] **Step 2: Tạo `.env.example`**

```bash
# URL back-end NestJS (Better Auth mount ở /api/auth). Copy sang .env.local khi dev.
NEXT_PUBLIC_API_URL=http://localhost:4000
```

- [ ] **Step 3: Tạo `.env.local`**

Run: `cp .env.example .env.local`

- [ ] **Step 4: Bật `allowImportingTsExtensions`**

Trong `tsconfig.json`, thêm vào `compilerOptions` ngay sau `"noEmit": true,`:

```json
    "allowImportingTsExtensions": true,
```

(Hợp lệ vì đã có `noEmit: true`. Cần cho file test import `./register-form.schema.ts` — Node bắt buộc có đuôi.)

- [ ] **Step 5: Tạo `src/lib/auth-client.ts`**

```ts
import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

// NEXT_PUBLIC_* được inline lúc build → thiếu biến thì báo ngay, không âm thầm gọi sai host.
const baseURL = process.env.NEXT_PUBLIC_API_URL;
if (!baseURL) throw new Error('Thiếu NEXT_PUBLIC_API_URL (xem .env.example)');

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    // Khớp user.additionalFields ở back-end/src/auth/auth.ts
    inferAdditionalFields({
      user: {
        targetTrack: { type: 'string', required: false },
        level: { type: 'string', required: false },
      },
    }),
  ],
});
```

- [ ] **Step 6: Typecheck**

Run: `pnpm exec tsc --noEmit -p . 2>&1 | grep -E "auth-client|tsconfig"`
Expected: không có output.

---

### Task 2: Schema form (TDD)

**Files:**
- Create: `src/app/(auth)/register/_components/register-form.schema.test.ts`
- Create: `src/app/(auth)/register/_components/register-form.schema.ts`

Lưu ý zod 4: `.refine` ở cấp object **không chạy** khi còn field khác lỗi → test "nhập lại không khớp" phải để mọi field khác hợp lệ. Schema chỉ dùng cú pháp Node strip được (không `enum`, không alias `@/`).

- [ ] **Step 1: Viết test**

`src/app/(auth)/register/_components/register-form.schema.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerSchema } from './register-form.schema.ts';

const valid = {
  name: '  Minh Khoa ',
  email: ' MinhKhoa@Example.com ',
  password: '12345678',
  confirmPassword: '12345678',
  acceptTerms: true,
};

function errorPaths(input: unknown): string[] {
  const result = registerSchema.safeParse(input);
  assert.equal(result.success, false);
  return result.error!.issues.map((issue) => issue.path.join('.'));
}

test('dữ liệu hợp lệ: trim tên, trim + lowercase email', () => {
  const result = registerSchema.safeParse(valid);
  assert.equal(result.success, true);
  assert.equal(result.data!.name, 'Minh Khoa');
  assert.equal(result.data!.email, 'minhkhoa@example.com');
});

test('tên dưới 2 ký tự sau trim', () => {
  assert.deepEqual(errorPaths({ ...valid, name: ' a ' }), ['name']);
});

test('tên quá 50 ký tự', () => {
  assert.deepEqual(errorPaths({ ...valid, name: 'a'.repeat(51) }), ['name']);
});

test('email sai định dạng', () => {
  assert.deepEqual(errorPaths({ ...valid, email: 'abc' }), ['email']);
});

test('mật khẩu 7 ký tự', () => {
  assert.deepEqual(errorPaths({ ...valid, password: '1234567', confirmPassword: '1234567' }), ['password']);
});

test('mật khẩu 129 ký tự', () => {
  const long = 'a'.repeat(129);
  assert.deepEqual(errorPaths({ ...valid, password: long, confirmPassword: long }), ['password']);
});

test('nhập lại mật khẩu không khớp', () => {
  assert.deepEqual(errorPaths({ ...valid, confirmPassword: '87654321' }), ['confirmPassword']);
});

test('chưa đồng ý điều khoản', () => {
  assert.deepEqual(errorPaths({ ...valid, acceptTerms: false }), ['acceptTerms']);
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `node --test 'src/app/(auth)/register/_components/register-form.schema.test.ts'`
Expected: FAIL với `ERR_MODULE_NOT_FOUND` (chưa có `register-form.schema.ts`). Cảnh báo "Reparsing as ES module" là vô hại.

- [ ] **Step 3: Viết schema**

`src/app/(auth)/register/_components/register-form.schema.ts`:

```ts
import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự').max(50, 'Họ tên tối đa 50 ký tự'),
    // trim/lowercase trước rồi mới kiểm định dạng, để " A@B.com " vẫn hợp lệ
    email: z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ')),
    // 8–128 = mặc định minPasswordLength/maxPasswordLength của Better Auth
    password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự').max(128, 'Mật khẩu tối đa 128 ký tự'),
    confirmPassword: z.string(),
    // boolean + refine (không dùng z.literal(true)) để defaultValues false vẫn đúng type
    acceptTerms: z.boolean().refine((v) => v, 'Bạn cần đồng ý với điều khoản'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp',
  });

export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterValues = z.output<typeof registerSchema>;
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `node --test 'src/app/(auth)/register/_components/register-form.schema.test.ts'`
Expected: `# pass 8`, `# fail 0`.

- [ ] **Step 5: Typecheck file test**

Run: `pnpm exec tsc --noEmit -p . 2>&1 | grep register-form`
Expected: không có output (không lỗi TS5097 vì đã bật `allowImportingTsExtensions` ở Task 1).

---

### Task 3: AuthShell + SocialButtons, refactor LoginView

**Files:**
- Create: `src/app/(auth)/_components/auth-shell.tsx`
- Create: `src/app/(auth)/_components/social-buttons.tsx`
- Modify: `src/app/(auth)/_components/login-view.tsx`

- [ ] **Step 1: Tạo `auth-shell.tsx`**

Markup lấy nguyên từ `login-view.tsx` (wrapper + logo + Card):

```tsx
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>
            Skill<span className="text-blue-600">Path</span>
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl font-extrabold">{title}</CardTitle>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Tạo `social-buttons.tsx`**

Hai `<svg>` lấy nguyên từ `login-view.tsx`. Chữ lỗi trung tính ("Tiếp tục với…") vì login dùng chung.

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

const PROVIDERS = [
  {
    id: 'google',
    label: 'Google',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
    ),
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
    ),
  },
] as const;

type Provider = (typeof PROVIDERS)[number];

export function SocialButtons() {
  const [pending, setPending] = useState<Provider['id'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn({ id, label }: Provider) {
    setError(null);
    setPending(id);
    try {
      // Thành công → better-auth tự redirect sang trang của provider
      const { error } = await authClient.signIn.social({
        provider: id,
        callbackURL: `${window.location.origin}/onboarding`,
      });
      // Provider thiếu key → back-end bỏ hẳn provider → 404 PROVIDER_NOT_FOUND
      if (error) setError(`Tiếp tục với ${label} tạm thời chưa khả dụng`);
    } catch {
      setError('Không kết nối được máy chủ, thử lại sau');
    }
    setPending(null);
  }

  return (
    <>
      <div className="space-y-2 mb-6">
        {PROVIDERS.map((provider) => (
          <Button
            key={provider.id}
            variant="outline"
            className="w-full"
            disabled={pending !== null}
            onClick={() => signIn(provider)}
          >
            {provider.icon}
            Tiếp tục với {provider.label}
          </Button>
        ))}
        {error && (
          <p role="alert" className="text-xs text-destructive text-center">{error}</p>
        )}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>hoặc</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>
    </>
  );
}
```

> **Chú ý khi implement:** copy 2 `<svg>` **trực tiếp từ `login-view.tsx`** (dòng các nút "Tiếp tục với Google/GitHub"), không gõ lại — chuỗi `d` rất dễ sai.

- [ ] **Step 3: Sửa `login-view.tsx`**

1. Xoá khối `<div className="min-h-screen ...">` ... `<CardContent>` mở đầu và `</CardContent></Card></div></div>` kết thúc; bọc nội dung bằng `<AuthShell title="Đăng nhập"> ... </AuthShell>`.
2. Xoá khối `{/* Social */}` (div `space-y-2 mb-6` chứa 2 Button) **và** khối divider "hoặc" ngay sau nó; thay bằng `<SocialButtons />`.
3. Giữ nguyên `<form ...>` (vẫn mock `router.push('/')`) và đoạn "Chưa có tài khoản? Đăng ký miễn phí".
4. Import: bỏ `BookOpen`, `Card`, `CardContent`, `CardHeader`, `CardTitle`; thêm:

```tsx
import { AuthShell } from './auth-shell';
import { SocialButtons } from './social-buttons';
```

Giữ `Button` (vẫn dùng cho nút ẩn/hiện mật khẩu), `useRouter`, `Eye`, `EyeOff`, `Btn`, `Input`, `Link`.

Kết quả phần return:

```tsx
  return (
    <AuthShell title="Đăng nhập">
      <SocialButtons />

      <form onSubmit={(e) => { e.preventDefault(); router.push('/'); }} className="space-y-4">
        {/* ...giữ nguyên các field email / mật khẩu / nút Đăng nhập... */}
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>
        Chưa có tài khoản?{' '}
        <Link href="/register" className="text-blue-600 font-semibold hover:underline">Đăng ký miễn phí</Link>
      </p>
    </AuthShell>
  );
```

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm exec tsc --noEmit -p . 2>&1 | grep "(auth)"; pnpm exec eslint 'src/app/(auth)' src/lib/auth-client.ts`
Expected: tsc không output; eslint 0 errors.

---

### Task 4: RegisterForm + page

**Files:**
- Create: `src/app/(auth)/register/_components/register-form.tsx`
- Modify: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Tạo `register-form.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { Btn } from '@/components/shared/product-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { AuthShell } from '../../_components/auth-shell';
import { SocialButtons } from '../../_components/social-buttons';
import { registerSchema, type RegisterInput, type RegisterValues } from './register-form.schema';

const RESEND_COOLDOWN = 60;
const RATE_LIMITED = 'Bạn thử quá nhiều lần, vui lòng đợi vài phút';
const NETWORK = 'Không kết nối được máy chủ, thử lại sau';

// Lỗi 400 của Better Auth lọt qua zod → gắn vào đúng ô
const FIELD_ERRORS: Record<string, { field: 'email' | 'password'; message: string }> = {
  INVALID_EMAIL: { field: 'email', message: 'Email không hợp lệ' },
  INVALID_PASSWORD: { field: 'password', message: 'Mật khẩu không hợp lệ' },
  PASSWORD_TOO_SHORT: { field: 'password', message: 'Mật khẩu cần ít nhất 8 ký tự' },
  PASSWORD_TOO_LONG: { field: 'password', message: 'Mật khẩu tối đa 128 ký tự' },
};

// Bấm link xác minh → back-end autoSignInAfterVerification → về đây
const callbackURL = () => `${window.location.origin}/onboarding`;

export function RegisterForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', acceptTerms: false },
  });

  async function onSubmit(values: RegisterValues) {
    setBanner(null);
    try {
      // Email đã tồn tại cũng trả 200 (requireEmailVerification → chống dò tài khoản)
      const { error } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        callbackURL: callbackURL(),
      });
      if (!error) {
        setSentTo(values.email);
        return;
      }
      const fieldError = error.code ? FIELD_ERRORS[error.code] : undefined;
      if (fieldError) setError(fieldError.field, { message: fieldError.message });
      else setBanner(error.status === 429 ? RATE_LIMITED : NETWORK);
    } catch {
      setBanner(NETWORK);
    }
  }

  if (sentTo) {
    return (
      <SentScreen
        email={sentTo}
        onBack={() => {
          // useForm vẫn giữ name/email khi form unmount (shouldUnregister mặc định false)
          resetField('password');
          resetField('confirmPassword');
          setSentTo(null);
        }}
      />
    );
  }

  const describedBy = (field: keyof RegisterInput) => (errors[field] ? `${field}-error` : undefined);

  return (
    <AuthShell title="Tạo tài khoản">
      <SocialButtons />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field id="name" label="Họ tên" error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Nguyễn Văn A" aria-invalid={!!errors.name} aria-describedby={describedBy('name')} {...register('name')} />
        </Field>

        <Field id="email" label="Email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="ten@email.com" aria-invalid={!!errors.email} aria-describedby={describedBy('email')} {...register('email')} />
        </Field>

        <Field id="password" label="Mật khẩu" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Ít nhất 8 ký tự"
              className="pr-10"
              aria-invalid={!!errors.password}
              aria-describedby={describedBy('password')}
              {...register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-0 top-1/2 -translate-y-1/2"
              aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPw ? <EyeOff size={15} style={{ color: 'var(--muted-foreground)' }} /> : <Eye size={15} style={{ color: 'var(--muted-foreground)' }} />}
            </Button>
          </div>
        </Field>

        <Field id="confirmPassword" label="Nhập lại mật khẩu" error={errors.confirmPassword?.message}>
          <Input
            id="confirmPassword"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={describedBy('confirmPassword')}
            {...register('confirmPassword')}
          />
        </Field>

        <div>
          <label className="flex items-start gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-[var(--primary)]"
              aria-invalid={!!errors.acceptTerms}
              aria-describedby={describedBy('acceptTerms')}
              {...register('acceptTerms')}
            />
            <span>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của SkillPath</span>
          </label>
          {errors.acceptTerms && <p id="acceptTerms-error" className="mt-1 text-xs text-destructive">{errors.acceptTerms.message}</p>}
        </div>

        {banner && (
          <div
            role="alert"
            className="rounded-lg border px-3 py-2 text-sm text-destructive"
            style={{ borderColor: 'var(--destructive)', background: 'color-mix(in srgb, var(--destructive) 8%, transparent)' }}
          >
            {banner}
          </div>
        )}

        <Btn variant="primary" size="lg" type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang tạo tài khoản...
            </>
          ) : (
            'Tạo tài khoản'
          )}
        </Btn>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-blue-600 font-semibold hover:underline">Đăng nhập</Link>
      </p>
    </AuthShell>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SentScreen({ email, onBack }: { email: string; onBack: () => void }) {
  // Bắt đầu đã khoá: email vừa được gửi lúc đăng ký
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    setResendError(null);
    setCooldown(RESEND_COOLDOWN);
    try {
      const { error } = await authClient.sendVerificationEmail({ email, callbackURL: callbackURL() });
      if (error) setResendError(error.status === 429 ? RATE_LIMITED : NETWORK);
    } catch {
      setResendError(NETWORK);
    }
  }

  return (
    <AuthShell title="Kiểm tra email">
      <div className="text-center space-y-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-7" />
        </div>
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          Chúng tôi đã gửi link xác minh tới <strong>{email}</strong>.
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Link hết hạn sau 24 giờ. Nếu email này đã có tài khoản, hãy{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">đăng nhập</Link>.
        </p>
        <Button variant="outline" className="w-full" disabled={cooldown > 0} onClick={resend}>
          {cooldown > 0 ? `Gửi lại email (${cooldown}s)` : 'Gửi lại email'}
        </Button>
        {resendError && <p role="alert" className="text-xs text-destructive">{resendError}</p>}
        <Button variant="link" onClick={onBack}>Dùng email khác</Button>
      </div>
    </AuthShell>
  );
}
```

- [ ] **Step 2: Sửa `register/page.tsx`**

Thay toàn bộ file:

```tsx
import type { Metadata } from 'next';
import { RegisterForm } from './_components/register-form';

export const metadata: Metadata = { title: 'Đăng ký | SkillPath' };

export default function RegisterPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm exec tsc --noEmit -p . 2>&1 | grep "(auth)"; pnpm exec eslint 'src/app/(auth)'`
Expected: tsc không output; eslint 0 errors.

---

### Task 5: Kiểm tra toàn bộ

- [ ] **Step 1: Test tự động + hồi quy**

Run:
```bash
node --test 'src/app/(auth)/register/_components/register-form.schema.test.ts'
pnpm exec tsc --noEmit -p .
pnpm lint
pnpm build
```
Expected: test `# pass 8`; tsc không lỗi; lint 0 errors; build liệt kê đủ route, có `○ /register` và `○ /login`.

- [ ] **Step 2: Chạy back-end + front-end**

```bash
# terminal 1 — /Users/bssgroup/Personal/Project/back-end
pnpm start:dev
# terminal 2 — /Users/bssgroup/Personal/Project/it-course-platform
pnpm dev
```


- [ ] **Step 3: Checklist thủ công trên Chrome (http://localhost:3000/register)**

Lưu ý: rate limit 3 lượt sign-up / 10 phút / IP — các bước 1, 3, 4 cùng tiêu lượt.

1. Bỏ trống, bấm "Tạo tài khoản" → lỗi dưới từng ô; nhập lại khác mật khẩu → lỗi ở ô nhập lại
2. Email mới hợp lệ → màn "Kiểm tra email" hiển thị đúng email, nút Gửi lại đang đếm ngược 60s; mail Brevo tới
3. Bấm link trong mail → đã đăng nhập, đang ở `/onboarding`
4. Đăng ký lại cùng email → vẫn màn Kiểm tra email (không báo trùng)
5. Submit tới khi quá 3 lượt/10 phút → banner "Bạn thử quá nhiều lần…"
6. Dừng back-end, submit → banner "Không kết nối được máy chủ…", dữ liệu form còn nguyên
7. Bấm Google (back-end chưa có `GOOGLE_CLIENT_ID`) → dòng lỗi "Tiếp tục với Google tạm thời chưa khả dụng"
8. Hết đếm ngược → bấm Gửi lại → nút khoá lại 60s
9. "Dùng email khác" → về form, tên + email còn, 2 ô mật khẩu trống
10. `/login` hiển thị như trước (logo, 2 nút OAuth, form, link Đăng ký)

- [ ] **Step 4: Đề xuất commit cho sếp (KHÔNG tự commit)**

```
feat(frontend): trang đăng ký nối Better Auth

- authClient (better-auth/react) + NEXT_PUBLIC_API_URL
- Form đăng ký react-hook-form + zod, test schema bằng node --test
- Màn Kiểm tra email + gửi lại (cooldown 60s)
- Tách AuthShell + SocialButtons dùng chung cho login/register (OAuth thật)
```
