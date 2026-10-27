import Classroom from '@/components/classroom/classroom';
import { pageTitle } from '@/lib/site-metadata';
export const metadata = { title: pageTitle('דמו ללא הרשמה') };
export default function DemoPage() {
  return (
    <Classroom
      isDemo
      profile={{
        username: 'demo_guest',
        first_name: 'אורח',
        last_name: '',
        city: '',
        age: 18,
        phone: '',
        locale: 'he',
        school: '',
        hobbies: [],
        custom_hobby: '',
      }}
    />
  );
}
