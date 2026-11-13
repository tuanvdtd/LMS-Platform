import { api } from '@/lib/api/client';
import type { CertificateInfo, CertificateSummary } from '@/types/certificate';

const BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/certificates`;

export const listMyCertificates = () => api.get<CertificateSummary[]>('/me/certificates').then((r) => r.data);

// Ảnh và PDF là endpoint công khai: dùng thẳng làm src / href, không qua axios.
export const certificateImageUrl = (serial: string) => `${BASE}/${encodeURIComponent(serial)}/image`;
export const certificatePdfUrl = (serial: string) => `${BASE}/${encodeURIComponent(serial)}/pdf`;

// Gọi từ server component của trang xác thực. null = không có chứng chỉ với mã này.
export async function getCertificate(serial: string): Promise<CertificateInfo | null> {
  const res = await fetch(`${BASE}/${encodeURIComponent(serial)}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Không tải được chứng chỉ (${res.status})`);
  return (await res.json()) as CertificateInfo;
}
