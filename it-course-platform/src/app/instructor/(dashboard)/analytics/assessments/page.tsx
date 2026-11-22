import type { Metadata } from 'next';
import { AssessmentsView } from './_components/assessments-view';

export const metadata: Metadata = { title: 'Chất lượng bài kiểm tra | Aolumi' };

export default function AnalyticsAssessmentsPage() {
  return <AssessmentsView />;
}
