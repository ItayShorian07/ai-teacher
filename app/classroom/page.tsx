import LearningHub from '@/components/classroom/learning-hub';
import { getClassroomAccess } from '@/lib/server/classroom-access';
import { pageTitle } from '@/lib/site-metadata';
export const dynamic = 'force-dynamic';
export const metadata = { title: pageTitle('הכיתה שלי · My classroom') };
export default async function ClassroomPage() {
  const { profile } = await getClassroomAccess();
  return <LearningHub profile={profile} />;
}
