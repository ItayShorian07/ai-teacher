import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appEnvironment,
  assertSupabaseTarget,
  environmentErrors,
  resolveSiteOrigin,
} from '../lib/environment';

const targets = {
  nonProductionSupabaseUrl: 'https://development.supabase.co',
  productionSupabaseUrl: 'https://production.supabase.co',
  productionSiteUrl: 'https://learn.example.com',
};

const services = {
  NEXT_PUBLIC_APP_ENV: 'development',
  NEXT_PUBLIC_SUPABASE_ENV: 'development',
  NEXT_PUBLIC_SUPABASE_URL: targets.nonProductionSupabaseUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-public-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-server-key',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-site-key',
  TURNSTILE_SECRET_KEY: 'test-captcha-key',
  GEMINI_API_KEY: 'test-ai-key',
};

test('local demo and isolated test builds do not need service credentials', () => {
  assert.deepEqual(environmentErrors({}, targets), []);
  assert.deepEqual(environmentErrors({ APP_ENV: 'test' }, targets), []);
  assert.equal(resolveSiteOrigin({}), 'http://127.0.0.1:3000');
  assert.ok(
    environmentErrors({ APP_ENV: 'test', ...services }, targets).length,
  );
});

test('development cannot connect to the production database', () => {
  assert.deepEqual(environmentErrors(services, targets), []);
  assert.ok(
    environmentErrors(
      { ...services, NEXT_PUBLIC_SUPABASE_URL: targets.productionSupabaseUrl },
      targets,
    ).length,
  );
  assert.ok(
    environmentErrors(services, {
      ...targets,
      nonProductionSupabaseUrl: targets.productionSupabaseUrl,
    }).length,
  );
  assert.ok(
    environmentErrors(services, { ...targets, productionSupabaseUrl: '' })
      .length,
  );
});

test('preview uses its own branch origin and non-production database', () => {
  const preview = {
    ...services,
    VERCEL_ENV: 'preview',
    VERCEL_BRANCH_URL: 'feature.example.com',
    VERCEL_URL: 'deployment.example.com',
  };
  assert.equal(resolveSiteOrigin(preview), 'https://feature.example.com');
  assert.deepEqual(environmentErrors(preview, targets), []);
  assert.equal(
    resolveSiteOrigin({
      VERCEL_ENV: 'preview',
      VERCEL_URL: 'deployment.example.com',
    }),
    'https://deployment.example.com',
  );
  assert.ok(
    environmentErrors(
      { ...preview, NEXT_PUBLIC_SITE_URL: targets.productionSiteUrl },
      targets,
    ).length,
  );
  assert.ok(
    environmentErrors(
      { ...preview, NEXT_PUBLIC_SUPABASE_URL: targets.productionSupabaseUrl },
      targets,
    ).length,
  );
});

test('production needs all services and its registered site and database', () => {
  const production = {
    ...services,
    NEXT_PUBLIC_APP_ENV: 'production',
    NEXT_PUBLIC_SUPABASE_ENV: 'production',
    VERCEL_ENV: 'production',
    NEXT_PUBLIC_SITE_URL: targets.productionSiteUrl,
    NEXT_PUBLIC_SUPABASE_URL: targets.productionSupabaseUrl,
  };
  assert.deepEqual(environmentErrors(production, targets), []);
  for (const key of Object.keys(services)) {
    assert.ok(
      environmentErrors({ ...production, [key]: '' }, targets).length,
      key,
    );
  }
  assert.ok(
    environmentErrors({ ...production, NEXT_PUBLIC_SITE_URL: '' }, targets)
      .length,
  );
  assert.ok(
    environmentErrors(
      { ...production, NEXT_PUBLIC_SITE_URL: 'https://other.example.com' },
      targets,
    ).length,
  );
  assert.ok(
    environmentErrors(
      {
        ...production,
        NEXT_PUBLIC_SUPABASE_URL: targets.nonProductionSupabaseUrl,
      },
      targets,
    ).length,
  );
});

test('the public environment labels already used by Vercel remain supported', () => {
  const preview = {
    ...services,
    VERCEL_ENV: 'preview',
    NEXT_PUBLIC_APP_ENV: 'preview',
    VERCEL_BRANCH_URL: 'dev.example.com',
  };
  assert.deepEqual(environmentErrors(preview, targets), []);
  assert.equal(
    appEnvironment({
      VERCEL_ENV: 'preview',
      NEXT_PUBLIC_APP_ENV: 'development',
    }),
    'preview',
  );
  assert.equal(
    resolveSiteOrigin({
      NEXT_PUBLIC_APP_ENV: 'preview',
      NEXT_PUBLIC_VERCEL_BRANCH_URL: 'dev.example.com',
    }),
    'https://dev.example.com',
  );
});

test('public and privileged Supabase clients reject wrong projects and data labels', () => {
  assert.doesNotThrow(() => assertSupabaseTarget(services, targets));
  for (const patch of [
    { NEXT_PUBLIC_APP_ENV: '' },
    { NEXT_PUBLIC_APP_ENV: 'production' },
    { NEXT_PUBLIC_SUPABASE_ENV: 'production' },
    { NEXT_PUBLIC_SUPABASE_ENV: 'preview' },
    { NEXT_PUBLIC_SUPABASE_URL: 'https://old-project.supabase.co' },
  ])
    assert.throws(() =>
      assertSupabaseTarget({ ...services, ...patch }, targets),
    );
  assert.throws(() =>
    appEnvironment({
      VERCEL_ENV: 'preview',
      NEXT_PUBLIC_APP_ENV: 'production',
    }),
  );
  assert.throws(() =>
    appEnvironment({
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'development',
    }),
  );
});

test('production cannot use the official Turnstile dummy keys', () => {
  const production = {
    ...services,
    NEXT_PUBLIC_APP_ENV: 'production',
    NEXT_PUBLIC_SUPABASE_ENV: 'production',
    VERCEL_ENV: 'production',
    NEXT_PUBLIC_SUPABASE_URL: targets.productionSupabaseUrl,
    NEXT_PUBLIC_SITE_URL: targets.productionSiteUrl,
  };
  for (const patch of [
    { NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA' },
    { TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA' },
  ]) {
    assert.ok(
      environmentErrors({ ...production, ...patch }, targets).some((error) =>
        error.includes('test keys'),
      ),
    );
  }
  assert.deepEqual(
    environmentErrors(
      {
        ...services,
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
        TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
      },
      targets,
    ),
    [],
  );
});

test('site origins reject remote local URLs, unsafe protocols and URL components', () => {
  for (const siteUrl of [
    'https://learn.example.com',
    'javascript:alert(1)',
    'http://127.0.0.1:3000/path',
    'http://user:pass@localhost:3000',
    'http://localhost:3000?next=external',
    'http://localhost:3000/#hash',
  ]) {
    assert.throws(
      () => resolveSiteOrigin({ NEXT_PUBLIC_SITE_URL: siteUrl }),
      siteUrl,
    );
  }
  assert.throws(() =>
    resolveSiteOrigin({
      APP_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    }),
  );
  assert.throws(() =>
    resolveSiteOrigin({
      APP_ENV: 'preview',
      NEXT_PUBLIC_SITE_URL: 'http://preview.example.com',
    }),
  );
  assert.equal(
    resolveSiteOrigin({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3100/' }),
    'http://localhost:3100',
  );
});

test('Vercel environment cannot be relabelled to bypass production checks', () => {
  assert.equal(appEnvironment({ VERCEL_ENV: 'preview' }), 'preview');
  assert.throws(() => appEnvironment({ APP_ENV: 'staging' }));
  assert.throws(() =>
    appEnvironment({ VERCEL_ENV: 'production', APP_ENV: 'test' }),
  );
  assert.ok(
    environmentErrors(
      { ...services, VERCEL_ENV: 'production', APP_ENV: 'development' },
      targets,
    ).length,
  );
});

test('configuration errors never include credential values', () => {
  const credential = 'private-test-value-do-not-print';
  const errors = environmentErrors(
    {
      ...services,
      GEMINI_API_KEY: credential,
      NEXT_PUBLIC_SUPABASE_URL: credential,
    },
    targets,
  );
  assert.ok(errors.length);
  assert.ok(!errors.join('\n').includes(credential));
});
