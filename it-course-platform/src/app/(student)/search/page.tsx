import { redirect } from 'next/navigation';

// Tìm kiếm gộp vào /courses?q= (spec public-catalog §4.2). Giữ route cho link cũ.
export default async function Page({ searchParams }: PageProps<'/search'>) {
  const { q } = await searchParams;
  redirect(`/courses${typeof q === 'string' && q ? `?q=${encodeURIComponent(q)}` : ''}`);
}
