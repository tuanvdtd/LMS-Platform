import type { Metadata } from 'next';
import MyLearningView from './_components/my-learning-view';

export const metadata: Metadata = { title: 'Học tập của tôi | Aolumi' };

export default function MyLearningPage() {
  return <MyLearningView />;
}
