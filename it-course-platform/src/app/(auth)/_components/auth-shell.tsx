import { LogoMark } from '@/components/shared/logo-mark';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <LogoMark className="h-9" />
          <span className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
            aolumi
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
