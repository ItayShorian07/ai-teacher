import LearningHub from '@/components/classroom/learning-hub';
import { demoProfile } from '@/lib/demo-profile';
import { pageTitle } from '@/lib/site-metadata';
export const metadata = { title: pageTitle('דמו ללא הרשמה') };
export default function DemoPage() {
  return <LearningHub profile={demoProfile} isDemo />;
}
