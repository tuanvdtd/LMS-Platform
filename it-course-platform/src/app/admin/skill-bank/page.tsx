import type { Metadata } from 'next';
import { SkillTopicsView } from './_components/skill-topics-view';

export const metadata: Metadata = { title: 'Ngân hàng kỹ năng | SkillPath Admin' };

export default function AdminSkillBankPage() {
  return <SkillTopicsView />;
}
