import type { Metadata } from 'next';
import { OnboardingView } from './_components/onboarding-view';

export const metadata: Metadata = { title: 'Thiết lập lộ trình | SkillPath' };

export default function OnboardingPage() {
  return <OnboardingView />;
}
