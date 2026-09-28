import type { Metadata } from 'next';
import Image from 'next/image';
import { Award, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Chứng chỉ của tôi | SkillPath' };

const certificate = {
  code: 'SP-2024-JS-48291',
  courseTitle: 'JavaScript Complete',
  issuedAt: '15/12/2024',
  thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=480&fit=crop',
};

export default function CertificatesPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Award className="size-5" /></div>
        <h1 className="text-2xl font-extrabold text-foreground">Chứng chỉ của tôi</h1>
      </div>
      <Card>
        <Image src={certificate.thumbnail} alt="" width={800} height={480} className="h-48 w-full object-cover" />
        <CardHeader>
          <CardTitle>{certificate.courseTitle}</CardTitle>
          <CardDescription>Cấp ngày: {certificate.issuedAt} · Mã: {certificate.code}</CardDescription>
        </CardHeader>
        <CardFooter className="gap-2">
          <Button><Download className="size-4" />Tải PDF</Button>
          <Button variant="outline"><Share2 className="size-4" />Chia sẻ LinkedIn</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
