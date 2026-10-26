'use client';

import type { AccountProfile } from '@/lib/auth-validation';
import { createTranslator, type Language } from '@/lib/i18n';
import type { InputHTMLAttributes } from 'react';

type ProfileField =
  'first_name' | 'last_name' | 'city' | 'age' | 'phone' | 'school';
export type ProfileFormValues = Record<ProfileField, string>;

export function createProfileFormValues(
  profile: Partial<AccountProfile> = {},
): ProfileFormValues {
  return {
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    city: profile.city || '',
    age: profile.age?.toString() || '',
    phone: profile.phone || '',
    school: profile.school || '',
  };
}

export function ProfileFields({
  language,
  values,
  onChange,
}: {
  language: Language;
  values: ProfileFormValues;
  onChange: (values: ProfileFormValues) => void;
}) {
  const translate = createTranslator(language);
  function field(
    name: ProfileField,
    label: string,
    attributes: InputHTMLAttributes<HTMLInputElement> = {},
  ) {
    return (
      <label className="auth-field">
        {label}
        <input
          name={name}
          value={values[name]}
          onChange={(event) =>
            onChange({ ...values, [name]: event.target.value })
          }
          required
          maxLength={60}
          {...attributes}
        />
      </label>
    );
  }
  return (
    <>
      <div className="auth-field-row">
        {field('first_name', translate('First name', 'שם פרטי'), {
          autoComplete: 'given-name',
        })}
        {field('last_name', translate('Last name', 'שם משפחה'), {
          autoComplete: 'family-name',
        })}
      </div>
      <div className="auth-field-row city-age">
        {field('city', translate('City / town', 'עיר / יישוב'), {
          autoComplete: 'address-level2',
          maxLength: 100,
        })}
        {field('age', translate('Age', 'גיל'), {
          type: 'number',
          min: 1,
          max: 120,
          inputMode: 'numeric',
          maxLength: undefined,
        })}
      </div>
      {field('phone', translate('Mobile number', 'טלפון נייד'), {
        type: 'tel',
        autoComplete: 'tel',
        dir: 'ltr',
        placeholder: '050-123-4567',
        maxLength: 24,
      })}
      {field('school', translate('School name', 'שם בית הספר'), {
        autoComplete: 'organization',
        maxLength: 120,
      })}
    </>
  );
}
