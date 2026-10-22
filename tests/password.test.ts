import test from 'node:test';
import assert from 'node:assert/strict';
import { usernameSchema, newPasswordSchema, passwordLoginSchema } from '../lib/password-validation';
import { LoginServices, passwordLogin } from '../lib/password-login';

const input = { identifier: ' Noa_Levi ', password: '  words with spaces  ', captchaToken: 'fresh-token' };
test('usernames are canonical; passwords are not silently changed', () => {
  assert.equal(usernameSchema.parse(' Noa_Levi '), 'noa_levi');
  for (const invalid of ['ab', '1noa', 'noa@school', 'noa levi', '<script>', 'a'.repeat(31)]) {
    assert.equal(usernameSchema.safeParse(invalid).success, false);
  }
  assert.equal(newPasswordSchema.parse(input.password), input.password);
  assert.equal(newPasswordSchema.safeParse('short').success, false);
  assert.equal(newPasswordSchema.safeParse(' '.repeat(20)).success, false);
  assert.equal(passwordLoginSchema.safeParse({ ...input, role: 'admin' }).success, false);
  assert.equal(passwordLoginSchema.safeParse({ ...input, captchaToken: '' }).success, false);
});
test('username login resolves privately and forwards the unchanged password and one captcha', async () => {
  const calls: unknown[] = [];
  const services: LoginServices = {
    quota: async id => { calls.push(['quota', id]); return true; },
    resolve: async id => { calls.push(['resolve', id]); return 'private@example.test'; },
    signIn: async (...args) => { calls.push(['signIn', ...args]); return { ok: true }; },
  };
  const result = await passwordLogin(input, services);
  assert.deepEqual(result, { status: 200, signedIn: true });
  assert.deepEqual(calls, [['quota','noa_levi'],['resolve','noa_levi'],['signIn','private@example.test',input.password,'fresh-token']]);
  assert.equal(JSON.stringify(result).includes('private@'), false);
});
test('unknown username and incorrect password return the same public error', async () => {
  let authCalls = 0;
  const services: LoginServices = { quota: async () => true, resolve: async () => null,
    signIn: async () => { authCalls++; return { ok: false }; } };
  const unknown = await passwordLogin(input, services);
  const incorrect = await passwordLogin(input, { ...services, resolve: async () => 'member@example.test' });
  assert.deepEqual(unknown, incorrect);
  assert.equal(unknown.status, 401);
  assert.equal(authCalls, 2);
});
test('rate limit is enforced before identifier lookup and password verification', async () => {
  const result = await passwordLogin(input, {
    quota: async () => false,
    resolve: async () => { assert.fail('lookup must not run'); },
    signIn: async () => { assert.fail('sign-in must not run'); },
  });
  assert.equal(result.status, 429);
});
test('email login works for migrated accounts and malformed inputs never reach providers', async () => {
  const services: LoginServices = {
    quota: async () => true, resolve: async () => { assert.fail('email must bypass handle lookup'); },
    signIn: async email => { assert.equal(email,'member@example.test'); return { ok: true }; },
  };
  assert.equal((await passwordLogin({ ...input, identifier:'MEMBER@example.test' }, services)).status, 200);
  assert.equal((await passwordLogin({ ...input, captchaToken:'' }, services)).status, 400);
});
