'use client';
import { interests } from '@/lib/profile-interests';

export function InterestPicker({
  language,
  values,
  onChange,
  custom,
  onCustom,
}: {
  language: 'he' | 'en';
  values: string[];
  onChange: (value: string[]) => void;
  custom: string;
  onCustom: (value: string) => void;
}) {
  return (
    <fieldset className="interest-picker">
      <legend>
        {language === 'he'
          ? 'מה מעניין אתכם? (לא חובה)'
          : 'What interests you? (optional)'}
      </legend>
      <div className="hobby-options">
        {interests.map(([id, en, he]) => (
          <button
            key={id}
            type="button"
            aria-pressed={values.includes(id)}
            className={`hobby-chip ${values.includes(id) ? 'selected' : ''}`}
            onClick={() =>
              onChange(
                values.includes(id)
                  ? values.filter((selectedInterest) => selectedInterest !== id)
                  : values.length < 20
                    ? [...values, id]
                    : values,
              )
            }
          >
            {language === 'he' ? he : en}
          </button>
        ))}
      </div>
      <label className="auth-field">
        {language === 'he'
          ? 'משהו נוסף שאתם אוהבים'
          : 'Something else you love'}
        <input
          value={custom}
          onChange={(event) => onCustom(event.target.value)}
          maxLength={60}
          placeholder={
            language === 'he'
              ? 'למשל מיינקראפט, הארי פוטר או K-pop'
              : 'Minecraft, Harry Potter or K-pop'
          }
        />
      </label>
    </fieldset>
  );
}
