import type { Metadata } from 'next';
import { SettingsView } from './_components/settings-view';

export const metadata: Metadata = { title: 'Cài đặt | Aolumi' };

// Next 16: searchParams là Promise
export default async function SettingsPage({ searchParams }: PageProps<'/settings'>) {
  const { tab } = await searchParams;
  return <SettingsView initialTab={Array.isArray(tab) ? tab[0] : tab} />;
}
