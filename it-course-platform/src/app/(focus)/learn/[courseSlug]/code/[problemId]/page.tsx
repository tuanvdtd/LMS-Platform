import type { Metadata } from 'next';
import CodeView from './_components/code-view';

export const metadata: Metadata = { title: 'Bài tập lập trình | SkillPath' };

export default function CodePage() {
  return <CodeView />;
}
