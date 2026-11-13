import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import { BadgeCheck, Download, FileQuestion, ShieldX } from 'lucide-react';
import { CertificateImage } from '@/components/certificate/certificate-image';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { certificateImageUrl, certificatePdfUrl, getCertificate } from '@/lib/api/certificates';

export async function generateMetadata({ params }: PageProps<'/verify/[code]'>): Promise<Metadata> {
  const { code } = await params;
  const cert = await getCertificate(code).catch(() => null);
  if (!cert) return { title: 'Không tìm thấy chứng chỉ | SkillPath' };
  return {
    title: `Chứng chỉ của ${cert.learnerName} | SkillPath`,
    description: `${cert.learnerName} đã hoàn thành khoá học ${cert.courseTitle}.`,
    openGraph: cert.revoked ? undefined : { images: [certificateImageUrl(cert.serialNo)] },
  };
}

export default async function VerifyCertificatePage({ params }: PageProps<'/verify/[code]'>) {
  const { code } = await params;
  const cert = await getCertificate(code);

  if (!cert) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <FileQuestion className="mx-auto mb-4 size-12 text-muted-foreground" aria-hidden />
        <h1 className="mb-2 text-xl font-extrabold text-foreground">Không tìm thấy chứng chỉ</h1>
        <p className="text-sm text-muted-foreground">
          Hãy kiểm tra lại mã trên chứng chỉ. Mã có dạng SP-XXXX-XXXX-XX.
        </p>
        <p className="mt-4 break-all font-mono text-sm text-foreground">{code}</p>
      </div>
    );
  }

  const rows: [string, React.ReactNode][] = [
    ['Học viên', cert.learnerName],
    [
      'Khoá học',
      <Link key="course" href={`/course/${cert.courseSlug}`} className="hover:underline">
        {cert.courseTitle}
      </Link>,
    ],
    ['Giảng viên', cert.instructorName],
    ...(cert.skills.length ? ([['Kỹ năng', cert.skills.join(', ')]] as [string, React.ReactNode][]) : []),
    ['Ngày cấp', new Date(cert.issuedAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })],
    ['Mã chứng chỉ', <span key="serial" className="font-mono">{cert.serialNo}</span>],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {cert.revoked ? (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-danger-border bg-danger-soft p-4">
          <ShieldX className="mt-0.5 size-6 shrink-0 text-danger" aria-hidden />
          <div>
            <h1 className="text-lg font-extrabold text-danger">Chứng chỉ đã bị thu hồi</h1>
            <p className="text-sm text-foreground">
              {cert.revokeReason ? `Lý do: ${cert.revokeReason}` : 'Chứng chỉ này không còn hiệu lực.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-success-border bg-success-soft p-4">
          <BadgeCheck className="mt-0.5 size-6 shrink-0 text-success" aria-hidden />
          <div>
            <h1 className="text-lg font-extrabold text-success">Chứng chỉ hợp lệ</h1>
            <p className="text-sm text-foreground">SkillPath xác nhận chứng chỉ này là thật.</p>
          </div>
        </div>
      )}

      {!cert.revoked && (
        <CertificateImage serial={cert.serialNo} alt={`Chứng chỉ của ${cert.learnerName}, khoá ${cert.courseTitle}`} className="mb-6" />
      )}

      <Card>
        <CardContent className="pt-6">
          {rows.map(([label, value], index) => (
            <Fragment key={label}>
              {index > 0 && <Separator className="my-3" />}
              <div className="flex justify-between gap-6 text-sm">
                <span className="shrink-0 text-muted-foreground">{label}</span>
                <span className="text-right font-semibold text-foreground">{value}</span>
              </div>
            </Fragment>
          ))}
        </CardContent>
      </Card>

      {!cert.revoked && (
        <div className="mt-6">
          <a href={certificatePdfUrl(cert.serialNo)} download className={buttonVariants()}>
            <Download data-icon="inline-start" />
            Tải PDF
          </a>
        </div>
      )}
    </div>
  );
}
