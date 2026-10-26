import assert from 'node:assert/strict';
import test from 'node:test';
import { callbackOrigin, validRequestOrigin } from '../lib/request-origin';

const preview = {
  VERCEL_ENV: 'preview',
  VERCEL_BRANCH_URL: 'branch.example.com',
  VERCEL_URL: 'deployment.example.com',
  NODE_ENV: 'production',
};

function request(
  origin?: string,
  url = 'https://deployment.example.com/api/account/profile',
) {
  return new Request(url, {
    method: 'POST',
    headers: origin ? { origin } : {},
  });
}

test('preview accepts its trusted branch and deployment aliases', () => {
  for (const origin of [
    'https://branch.example.com',
    'https://deployment.example.com',
  ]) {
    assert.equal(validRequestOrigin(request(origin), preview), true);
    assert.equal(
      callbackOrigin(`${origin}/auth/callback?code=test`, preview),
      origin,
    );
  }
});

test('preview rejects production, other branches and forged origins', () => {
  for (const origin of [
    undefined,
    'null',
    'https://production.example.com',
    'https://other-branch.example.com',
    'https://branch.example.com.attacker.test',
    'http://branch.example.com',
  ]) {
    assert.equal(validRequestOrigin(request(origin), preview), false, origin);
  }
  assert.equal(
    callbackOrigin('https://attacker.test/auth/callback', preview),
    'https://branch.example.com',
  );
});

test('production only accepts its configured origin', () => {
  const production = {
    ...preview,
    VERCEL_ENV: 'production',
    NEXT_PUBLIC_SITE_URL: 'https://learn.example.com',
  };
  assert.equal(
    validRequestOrigin(request('https://learn.example.com'), production),
    true,
  );
  assert.equal(
    validRequestOrigin(request('https://deployment.example.com'), production),
    false,
  );
  assert.equal(
    callbackOrigin('https://attacker.test/auth/callback', production),
    'https://learn.example.com',
  );
});

test('local aliases need loopback hosts, matching ports and development mode', () => {
  const env = {
    APP_ENV: 'development',
    NODE_ENV: 'development',
    NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3000',
  };
  const localUrl = 'http://127.0.0.1:3100/api/account/profile';
  assert.equal(
    validRequestOrigin(request('http://localhost:3100', localUrl), env),
    true,
  );
  for (const origin of [
    'http://localhost:3200',
    'https://localhost:3100',
    'http://attacker.test:3100',
    'http://localhost:3100/path',
  ]) {
    assert.equal(
      validRequestOrigin(request(origin, localUrl), env),
      false,
      origin,
    );
  }
  assert.equal(
    validRequestOrigin(request('http://localhost:3100', localUrl), {
      ...env,
      NODE_ENV: 'production',
    }),
    false,
  );
  assert.equal(
    callbackOrigin('http://localhost:3100/auth/callback', env),
    'http://localhost:3100',
  );
  assert.equal(
    callbackOrigin('https://attacker.test/auth/callback', env),
    'http://127.0.0.1:3000',
  );
});
