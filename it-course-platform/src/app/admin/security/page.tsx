import type { Metadata } from 'next';
import { SecuritySettings } from '@/components/security/security-settings';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Bảo mật | Aolumi Admin' };

// Tài khoản nghiệp vụ không vào được /settings của học viên → mật khẩu, xác thực hai lớp và phiên đăng nhập nằm ở đây.
export default function AdminSecurityPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Bảo mật tài khoản</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tài khoản nghiệp vụ có quyền duyệt và chi trả, nên bật xác thực hai lớp.</p>
      </div>
      <Card>
        <CardContent className="[&>div>section:first-child]:pt-0 [&>div>section:last-child]:border-b-0 [&>div>section:last-child]:pb-0">
          <SecuritySettings />
        </CardContent>
      </Card>
    </div>
  );
}
