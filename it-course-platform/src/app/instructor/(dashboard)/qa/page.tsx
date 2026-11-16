import type { Metadata } from 'next';
import { QAView } from './_components/qa-view';

export const metadata: Metadata = { title: 'Hỏi đáp | Aolumi' };

export default function QAPage() {
  return <QAView />;
}
