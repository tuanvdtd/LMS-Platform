import type { Metadata } from 'next';
import { Fragment } from 'react';
import { BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = { title: 'Xác minh chứng chỉ | SkillPath' };

export default async function VerifyCertificatePage({ params }: PageProps<'/verify/[code]'>) {
  const { code } = await params;
  const rows = [
    ['Học viên', 'Minh Khoa'],
    ['Khoá học', 'JavaScript Complete'],
    ['Giảng viên', 'Nguyễn Thành Long'],
    ['Ngày cấp', '15/12/2024'],
    ['Mã chứng chỉ', code],
  ];

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <BadgeCheck className="mx-auto mb-4 size-12 text-emerald-600" />
      <h1 className="mb-2 text-xl font-extrabold text-emerald-600">Chứng chỉ hợp lệ</h1>
      <p className="mb-6 text-sm text-muted-foreground">Chứng chỉ này đã được SkillPath xác nhận là hợp lệ.</p>
      <Card>
        <CardContent className="pt-6 text-left">
          {rows.map(([label, value], index) => (
            <Fragment key={label}>
              {index > 0 && <Separator className="my-3" />}
              <div className="flex justify-between gap-6 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-right font-semibold text-foreground">{value}</span>
              </div>
            </Fragment>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
