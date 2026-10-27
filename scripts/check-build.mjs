import { spawnSync } from 'node:child_process';

const env = {
  ...process.env,
  NODE_ENV: 'production',
  APP_ENV: 'test',
  NEXT_PUBLIC_APP_ENV: 'test',
  NEXT_PUBLIC_SUPABASE_ENV: '',
  NEXT_PUBLIC_VERCEL_ENV: '',
  NEXT_PUBLIC_VERCEL_URL: '',
  NEXT_PUBLIC_VERCEL_BRANCH_URL: '',
  NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3100',
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: '',
  TURNSTILE_SECRET_KEY: '',
  GEMINI_API_KEY: '',
  GEMINI_MODEL: '',
  VERCEL_ENV: '',
  VERCEL_BRANCH_URL: '',
  VERCEL_URL: '',
};

// Empty values keep Next.js from loading local service credentials.
const result = spawnSync(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'build'],
  {
    stdio: 'inherit',
    env,
  },
);

if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
