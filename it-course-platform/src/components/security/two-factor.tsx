'use client';

import { useState } from 'react';
import { Check, Copy, Download, ShieldCheck, ShieldOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { GENERIC, NETWORK } from '@/app/(auth)/_components/auth-messages';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { authClient } from '@/lib/auth-client';
import { CodeInput, PasswordField } from './fields';
import { securityError } from './messages';

type Mode = 'enable' | 'disable' | 'codes';

const COPY: Record<Mode, { title: string; description: string; submit: string }> = {
  enable: {
    title: 'Bật xác thực hai lớp',
    description: 'Nhập mật khẩu để xác nhận đây là bạn.',
    submit: 'Tiếp tục',
  },
  disable: {
    title: 'Tắt xác thực hai lớp',
    description: 'Sau khi tắt, đăng nhập chỉ cần mật khẩu. Các mã dự phòng hiện có sẽ bị huỷ.',
    submit: 'Tắt xác thực hai lớp',
  },
  codes: {
    title: 'Tạo lại mã dự phòng',
    description: 'Bộ mã cũ sẽ hết hiệu lực ngay khi bộ mới được tạo.',
    submit: 'Tạo mã mới',
  },
};

// Xác thực hai lớp bằng ứng dụng tạo mã (TOTP). Chỉ áp cho đăng nhập bằng email + mật khẩu,
// nên tài khoản chưa có mật khẩu phải tạo mật khẩu trước (back-end cũng đòi mật khẩu để bật/tắt).
export function TwoFactor({ enabled, hasPassword }: { enabled: boolean; hasPassword: boolean }) {
  const [mode, setMode] = useState<Mode | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {enabled ? (
          <Badge className="bg-success-soft text-success">
            <ShieldCheck aria-hidden />
            Đang bật
          </Badge>
        ) : (
          <Badge variant="secondary">
            <ShieldOff aria-hidden />
            Chưa bật
          </Badge>
        )}
      </div>
      <p className="max-w-prose text-sm text-muted-foreground">
        Khi đăng nhập bằng email và mật khẩu, bạn nhập thêm mã 6 số từ ứng dụng xác thực như Google Authenticator,
        Microsoft Authenticator hoặc Authy. Đăng nhập bằng Google hay GitHub dùng lớp bảo vệ của chính dịch vụ đó.
      </p>
      {!hasPassword ? (
        <p className="text-sm text-muted-foreground">Tài khoản chưa có mật khẩu. Hãy tạo mật khẩu ở mục trên rồi bật xác thực hai lớp.</p>
      ) : enabled ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setMode('codes')}>
            Tạo lại mã dự phòng
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setMode('disable')}>
            Tắt xác thực hai lớp
          </Button>
        </div>
      ) : (
        <div>
          <Button onClick={() => setMode('enable')}>Bật xác thực hai lớp</Button>
        </div>
      )}

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="sm:max-w-md">{mode && <Flow key={mode} mode={mode} onClose={() => setMode(null)} />}</DialogContent>
      </Dialog>
    </div>
  );
}

type Step = { name: 'password' } | { name: 'scan'; uri: string; codes: string[] } | { name: 'codes'; codes: string[] };

// Mật khẩu → (bật: quét QR + nhập mã) → mã dự phòng. Tắt thì dừng sau bước mật khẩu.
function Flow({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const [step, setStep] = useState<Step>({ name: 'password' });
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent, action: () => Promise<string | void>) {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      setError((await action()) || undefined);
    } catch {
      setError(NETWORK);
    }
    setBusy(false);
  }

  const confirmPassword = async () => {
    if (!password) return 'Nhập mật khẩu';
    if (mode === 'enable') {
      const { data, error } = await authClient.twoFactor.enable({ password });
      if (error) return securityError(error);
      // Back-end chỉ bật TOTP; nhánh 'otp' (mã qua email) không cấu hình.
      if (!('totpURI' in data)) return GENERIC;
      setStep({ name: 'scan', uri: data.totpURI, codes: data.backupCodes });
    } else if (mode === 'codes') {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({ password });
      if (error) return securityError(error);
      setStep({ name: 'codes', codes: data.backupCodes });
    } else {
      const { error } = await authClient.twoFactor.disable({ password });
      if (error) return securityError(error);
      toast.success('Đã tắt xác thực hai lớp');
      onClose();
    }
  };

  const confirmCode = async (codes: string[]) => {
    if (code.length !== 6) return 'Nhập đủ 6 chữ số';
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    if (error) return securityError(error);
    toast.success('Đã bật xác thực hai lớp');
    setStep({ name: 'codes', codes });
  };

  if (step.name === 'password') {
    const copy = COPY[mode];
    return (
      <form onSubmit={(e) => submit(e, confirmPassword)} className="grid gap-4">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <PasswordField
          id="twoFactorPassword"
          label="Mật khẩu"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" variant={mode === 'disable' ? 'destructive' : 'default'} isLoading={busy}>
            {copy.submit}
          </Button>
        </DialogFooter>
      </form>
    );
  }

  if (step.name === 'scan') {
    const secret = new URL(step.uri).searchParams.get('secret') ?? '';
    return (
      <form onSubmit={(e) => submit(e, () => confirmCode(step.codes))} className="grid gap-4">
        <DialogHeader>
          <DialogTitle>Quét mã bằng ứng dụng xác thực</DialogTitle>
          <DialogDescription>Mở ứng dụng, chọn thêm tài khoản rồi quét mã QR. Sau đó nhập mã 6 số ứng dụng hiển thị.</DialogDescription>
        </DialogHeader>
        {/* Mã QR luôn đen trên trắng: máy quét cần tương phản cố định, kể cả ở theme tối. */}
        <div className="mx-auto rounded-lg border bg-white p-3">
          <QRCodeSVG value={step.uri} size={176} title="Mã QR thiết lập xác thực hai lớp" />
        </div>
        <div className="grid gap-1 text-center">
          <p className="text-sm text-muted-foreground">Không quét được? Nhập khoá này vào ứng dụng:</p>
          <div className="flex items-center justify-center gap-1">
            <code className="rounded-md bg-muted px-2 py-1 font-mono text-[0.8125rem] break-all">{secret}</code>
            <CopyButton text={secret} label="Sao chép khoá" iconOnly />
          </div>
        </div>
        <Field data-invalid={!!error || undefined}>
          <FieldLabel htmlFor="twoFactorCode">Mã 6 số</FieldLabel>
          <CodeInput id="twoFactorCode" value={code} onChange={setCode} autoFocus aria-invalid={!!error} />
          {error && <FieldError>{error}</FieldError>}
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" isLoading={busy}>
            Xác nhận và bật
          </Button>
        </DialogFooter>
      </form>
    );
  }

  const text = step.codes.join('\n');
  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Lưu mã dự phòng</DialogTitle>
        <DialogDescription>
          Mỗi mã đăng nhập được một lần khi bạn không có điện thoại bên cạnh. Aolumi không hiện lại các mã này, hãy lưu ở nơi an toàn.
        </DialogDescription>
      </DialogHeader>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg border bg-muted px-4 py-3 font-mono text-[0.8125rem]">
        {step.codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <Field>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={text} label="Sao chép" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const url = URL.createObjectURL(new Blob([`Mã dự phòng Aolumi\n\n${text}\n`], { type: 'text/plain' }));
              Object.assign(document.createElement('a'), { href: url, download: 'aolumi-ma-du-phong.txt' }).click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download data-icon="inline-start" aria-hidden />
            Tải tệp .txt
          </Button>
        </div>
        <FieldDescription>Tạo lại bộ mã bất cứ lúc nào ở mục Xác thực hai lớp.</FieldDescription>
      </Field>
      <DialogFooter>
        <Button onClick={onClose}>Tôi đã lưu mã</Button>
      </DialogFooter>
    </div>
  );
}

function CopyButton({ text, label, iconOnly }: { text: string; label: string; iconOnly?: boolean }) {
  const [copied, setCopied] = useState(false);
  const Icon = copied ? Check : Copy;
  return (
    <Button
      type="button"
      variant={iconOnly ? 'ghost' : 'outline'}
      size={iconOnly ? 'icon-sm' : 'sm'}
      aria-label={iconOnly ? label : undefined}
      onClick={() =>
        navigator.clipboard.writeText(text).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          },
          () => toast.error('Không sao chép được, hãy chọn và sao chép thủ công'),
        )
      }
    >
      <Icon data-icon={iconOnly ? undefined : 'inline-start'} aria-hidden />
      {!iconOnly && (copied ? 'Đã sao chép' : label)}
    </Button>
  );
}
