import Classroom from '@/components/classroom/classroom';
export const metadata = { title: 'דמו ללא הרשמה | Limud' };
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
