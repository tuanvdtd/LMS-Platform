import type { Metadata } from 'next';
import { CertificatesView } from './_components/certificates-view';

export const metadata: Metadata = { title: 'Chứng chỉ của tôi | SkillPath' };

export default function CertificatesPage() {
  return <CertificatesView />;
}
