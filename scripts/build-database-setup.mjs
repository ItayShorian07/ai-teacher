import { readFileSync, writeFileSync } from 'node:fs';
const files = [
  '002_profiles.sql',
  '003_school_hobbies_story_cache.sql',
  'schema.sql',
  '004_learning_services.sql',
  '005_username_login.sql',
];
const sql = files
  .map((file) =>
    readFileSync(new URL(`../database/${file}`, import.meta.url), 'utf8'),
  )
  .join('\n');
writeFileSync(
  new URL('../database/setup.sql', import.meta.url),
  '-- Complete POC setup. Regenerate with node scripts/build-database-setup.mjs.\n' +
    '-- Run in the Supabase SQL editor. Existing user data is preserved.\nbegin;\n' +
    sql +
    '\ncommit;\n',
);
