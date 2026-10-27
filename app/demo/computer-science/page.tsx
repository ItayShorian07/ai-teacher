import Classroom from '@/components/classroom/classroom';
import { demoProfile } from '@/lib/demo-profile';
import { pageTitle } from '@/lib/site-metadata';

export const metadata = { title: pageTitle('דמו מדעי המחשב') };

export default function DemoComputerSciencePage() {
  return <Classroom profile={demoProfile} subject="cs" isDemo />;
}
