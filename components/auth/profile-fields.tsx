'use client';

import { createTranslator, type Language } from '@/lib/i18n';
import type { InputHTMLAttributes } from 'react';

import type { ProfileFormValues } from '@/lib/profile-form-values';
import { gradeNames, type SchoolGrade } from '@/lib/demo-lessons';
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
    name: keyof ProfileFormValues,
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
      {field('username', translate('Username', 'שם משתמש'), {
        dir: 'ltr',
        autoComplete: 'username',
        autoCapitalize: 'none',
        spellCheck: false,
        minLength: 3,
        maxLength: 30,
        pattern: '[A-Za-z][A-Za-z0-9_]{2,29}',
      })}
      <p className="auth-field-note">
        {translate(
          '3–30 English letters, numbers or underscores. Start with a letter.',
          '3–30 אותיות באנגלית, ספרות או קו תחתון. מתחילים באות.',
        )}
      </p>
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
      <label className="auth-field">
        {translate('Grade', 'כיתה')}
        <select
          name="grade"
          value={values.grade}
          required
          onChange={(event) =>
            onChange({ ...values, grade: event.target.value })
          }
        >
          <option value="" disabled>
            {translate('Choose your grade', 'בחרו כיתה')}
          </option>
          {(Object.keys(gradeNames).map(Number) as SchoolGrade[]).map(
            (grade) => (
              <option value={grade} key={grade}>
                {gradeNames[grade][language]}
              </option>
            ),
          )}
        </select>
      </label>
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
