import Classroom from '@/components/classroom/classroom';
import { getClassroomAccess } from '@/lib/server/classroom-access';
import { pageTitle } from '@/lib/site-metadata';

export const dynamic = 'force-dynamic';
export const metadata = { title: pageTitle('מתמטיקה · Mathematics') };

export default async function MathematicsPage() {
  const { profile, hasProAccess } = await getClassroomAccess();
  return (
    <Classroom profile={profile} subject="math" hasProAccess={hasProAccess} />
  );
}
