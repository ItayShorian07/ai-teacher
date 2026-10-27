import assert from 'node:assert/strict';
import test from 'node:test';
import {
  accountDeletionSchema,
  accountProfileSchema,
  emailSchema,
  getAuthErrorCode,
  humanVerificationSchema,
  isAccountComplete,
  normalizePhone,
  otpSchema,
} from '../lib/auth-validation';
const profile = {
  username: 'noa_levi',
  first_name: 'נועה',
  last_name: 'לוי',
  city: 'חיפה',
  age: 14,
  phone: '+972501234567',
  locale: 'he',
  school: 'תיכון חיפה',
};
const user = {
  email: 'student@example.test',
  email_confirmed_at: '2026-09-12',
  phone: '972501234567',
  phone_confirmed_at: '2026-09-12',
};
test('Israeli phone formats canonicalize without losing international support', () => {
  for (const phone of [
    '050-123-4567',
    '050 123 4567',
    '972501234567',
    '+972 (50) 123-4567',
  ])
    assert.equal(normalizePhone(phone), profile.phone);
  assert.equal(normalizePhone('+1 415 555 0123'), '+14155550123');
});

test('malformed provider errors cannot break public error handling', () => {
  for (const error of [
    null,
    undefined,
    'failure',
    42,
    { code: 7 },
    { code: null },
  ]) {
    assert.equal(getAuthErrorCode(error), 'unavailable');
  }
  assert.equal(getAuthErrorCode({ status: 429 }), 'rate_limit');
  assert.equal(
    getAuthErrorCode({ code: 'email_not_confirmed' }),
    'invalid_credentials',
  );
});

test('sensitive account actions validate their complete request bodies', () => {
  assert.equal(
    humanVerificationSchema.safeParse({ token: 'valid-token' }).success,
    true,
  );
  assert.equal(
    humanVerificationSchema.safeParse({ token: 'x'.repeat(2049) }).success,
    false,
  );
  assert.equal(
    humanVerificationSchema.safeParse({
      token: 'valid-token',
      userId: 'another-user',
    }).success,
    false,
  );
  assert.equal(
    accountDeletionSchema.safeParse({ confirmation: 'DELETE' }).success,
    true,
  );
  for (const body of [
    null,
    {},
    { confirmation: 'delete' },
    { confirmation: 'DELETE', userId: 'another-user' },
  ]) {
    assert.equal(accountDeletionSchema.safeParse(body).success, false);
  }
});
test('registration validates required fields and strips whitespace', () => {
  assert.equal(
    accountProfileSchema.parse({
      ...profile,
      first_name: ' נועה ',
      age: '14',
      phone: '0501234567',
    }).first_name,
    'נועה',
  );
  for (const invalid of [
    { first_name: '' },
    { last_name: '' },
    { city: '' },
    { school: '' },
    { age: 0 },
    { age: 121 },
    { age: 14.5 },
    { phone: '123' },
    { locale: 'xx' },
    { verified: true },
    { role: 'admin' },
    { id: 'another-user' },
  ])
    assert.equal(
      accountProfileSchema.safeParse({ ...profile, ...invalid }).success,
      false,
      JSON.stringify(invalid),
    );
  assert.equal(emailSchema.safeParse('not-an-email').success, false);
  assert.equal(otpSchema.safeParse('abc123').success, false);
  assert.equal(otpSchema.safeParse('123456').success, true);
});
test('completion requires trusted email and required profile fields in the POC', () => {
  assert.equal(isAccountComplete(user, profile), true);
  assert.equal(
    isAccountComplete({ ...user, email_confirmed_at: null }, profile),
    false,
  );
  assert.equal(
    isAccountComplete({ ...user, phone_confirmed_at: null }, profile),
    true,
  );
  assert.equal(
    isAccountComplete({ ...user, phone: '972509999999' }, profile),
    true,
  );
  assert.equal(isAccountComplete(user, null), false);
  assert.equal(isAccountComplete(user, { ...profile, city: '' }), false);
  // Generic confirmation or editable metadata never substitutes for channel verification.
  const spoof = {
    email: user.email,
    phone: user.phone,
    confirmed_at: 'today',
    user_metadata: {
      email_verified: true,
      phone_verified: true,
      complete: true,
    },
  };
  assert.equal(isAccountComplete(spoof, profile), false);
});
test('an SMS verification session for another account cannot complete onboarding', () => {
  const changedSession = { ...user, id: 'different-account' };
  assert.equal(
    isAccountComplete(changedSession, profile, 'original-account'),
    false,
  );
  assert.equal(
    isAccountComplete(
      { ...user, id: 'original-account' },
      profile,
      'original-account',
    ),
    true,
  );
});

test('nullable optional hobbies from Postgres do not block a complete account', () => {
  assert.equal(
    isAccountComplete(user, { ...profile, custom_hobby: null }),
    true,
  );
  assert.deepEqual(
    accountProfileSchema.parse({ ...profile, hobbies: ['music', 'music'] })
      .hobbies,
    ['music'],
  );
  assert.equal(
    isAccountComplete(user, { ...profile, school: undefined }),
    false,
  );
});
