import Classroom from '@/components/classroom/classroom';
import { demoProfile } from '@/lib/demo-profile';
import { pageTitle } from '@/lib/site-metadata';

export const metadata = { title: pageTitle('דמו מתמטיקה') };

export default function DemoMathematicsPage() {
  return <Classroom profile={demoProfile} subject="math" isDemo />;
}
