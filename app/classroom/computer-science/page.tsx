import Classroom from '@/components/classroom/classroom';
import { getClassroomAccess } from '@/lib/server/classroom-access';
import { pageTitle } from '@/lib/site-metadata';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: pageTitle('מדעי המחשב · Computer science'),
};

export default async function ComputerSciencePage() {
  const { profile, hasProAccess } = await getClassroomAccess();
  return (
    <Classroom profile={profile} subject="cs" hasProAccess={hasProAccess} />
  );
}
