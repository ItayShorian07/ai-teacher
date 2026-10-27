import nextEnv from '@next/env';
import { readFileSync } from 'node:fs';
import { environmentErrors } from '../lib/environment.ts';
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), true);
const targets = JSON.parse(
  readFileSync(new URL('../config/environments.json', import.meta.url), 'utf8'),
);
const errors = environmentErrors(process.env, targets);
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exit(1);
}
const names = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
];
for (const name of names) {
  console.log(`${name}: ${process.env[name] ? 'configured' : 'missing'}`);
  if (!process.env[name]) process.exitCode = 1;
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) process.exit(1);
for (const path of [
  '/auth/v1/settings',
  '/rest/v1/profiles?select=id,username,school,hobbies,custom_hobby&limit=0',
  '/rest/v1/material_chunks?select=id&limit=0',
  '/rest/v1/question_items?select=id&limit=0',
  '/rest/v1/learning_cache?select=id&limit=0',
  '/rest/v1/learning_questions?select=id&limit=0',
  '/rest/v1/ai_quota?select=user_id&limit=0',
  '/rest/v1/entitlements?select=user_id&limit=0',
]) {
  try {
    const r = await fetch(url + path, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(15000),
    });
    const d = await r.json();
    if (!r.ok && d.code !== '42501') process.exitCode = 1;
    console.log(
      path,
      r.status,
      path.includes('settings')
        ? {
            signup: !d.disable_signup,
            google: d.external?.google,
            email: d.external?.email,
            phone: d.external?.phone,
          }
        : r.ok
          ? 'reachable'
          : { code: d.code, message: d.message },
    );
  } catch (e) {
    console.log(path, e.cause?.code || e.name);
    process.exitCode = 1;
  }
}
