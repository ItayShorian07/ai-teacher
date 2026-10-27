import type { AccountProfile } from './auth-validation';
type ProfileField =
  | 'username'
  | 'first_name'
  | 'last_name'
  | 'city'
  | 'age'
  | 'grade'
  | 'phone'
  | 'school';
export type ProfileFormValues = Record<ProfileField, string>;

export function createProfileFormValues(
  profile: Partial<AccountProfile> = {},
): ProfileFormValues {
  return {
    username: profile.username || '',
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    city: profile.city || '',
    age: profile.age?.toString() || '',
    grade: profile.grade?.toString() || '',
    phone: profile.phone || '',
    school: profile.school || '',
  };
}
