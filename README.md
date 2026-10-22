# Limud · לימוד

Bilingual AI learning POC built with Next.js 16, Supabase and Gemini.

- `/` and `/login`: username/email + password, email OTP, Google sign-in when configured, and a public demo link.
- `/register`: username, password, profile details and email verification.
- `/forgot-password` and `/account/password`: email-based password recovery and authenticated password setup.
- `/demo`: local lessons and deterministic practice without a login or AI calls.
- `/classroom`: authenticated learning with required profile fields, optional interests, AI stories/questions, PDF transcription and Pro coaching.
- `/account`: profile editing, sign-out and explicit account deletion.
- `/contact`: contact information and FAQs.

A persistent light/dark switch is available in the authentication and classroom headers.

## Current connection status

Use `npm run check:connections` for current configuration and database checks. Credentials belong in the ignored `.env.local` file and the hosting environment, never in `.env.example`. A successful configuration check does not replace end-to-end verification of email delivery, OAuth, data isolation or deletion. The site disables auth controls when the required profile schema or Turnstile configuration is unavailable.

Read the full [implementation and connection report in Hebrew](docs/IMPLEMENTATION_STATUS.he.md). It maps every requested feature, explains bot protection and lists exact activation steps and limitations.

The live check on 2026-10-20 returned `configured:false`. The current login blocker is deployment configuration, not the absence of a login page. See the updated [account activation guide and missing-features list](docs/ACCOUNTS_SETUP.he.md).

## Setup

Use Node 22 or newer. Install with `npm ci`, configure `.env.local` using `.env.example`, and run `npm run dev`.

Apply [`database/setup.sql`](database/setup.sql) in Supabase SQL Editor. **One Supabase Postgres database is enough**, with pgvector collections for approved material, question/rubric data and generated-content caching. No additional vector database service is required.

For a project already using the previous schema, apply only `database/005_username_login.sql`. Existing users choose a unique username during onboarding. Set a 12-character password minimum in Supabase and include `{{ .Token }}` in the signup, magic-link and password-reset email templates. Username login also requires the server-only service-role key; it privately resolves the username, then Supabase verifies the password with the public client. SQL quotas and CAPTCHA protect the endpoint. Passwords never enter the profile table.

Set up Google OAuth, custom SMTP/OTP delivery and Turnstile in the provider dashboards. AI endpoints require a verified email, complete profile, signed human-verification cookie and distributed database quota. Secrets stay server-side. Pro is granted manually through `entitlements`; client metadata cannot grant it.

The PDF workflow transcribes an answer up to 3MB, lets the student review it and submits the reviewed text. PDFs are not stored by the application. The Pro assistant reviews code but does not execute it. Session progress currently resets on reload; durable attempts/mastery and sandboxed execution remain separate future features.

## Validation

```sh
npm test
npm run typecheck
npm run build
node scripts/check-connections.mjs
```

For local route checks, run `npm run dev -- --port 3100`, then `node scripts/check-routes.mjs`. Tests also run the username migration in embedded PostgreSQL (PGlite), exercising uniqueness, RLS, private lookup grants and atomic rate limits. Live integration tests require configured external services. Regenerate the combined schema with `node scripts/build-database-setup.mjs` when a migration changes.

GitHub: https://github.com/ItayShorian07/ai-teacher

Existing deployment: https://ai-teacher-three-pied.vercel.app. Local edits are not deployed automatically until pushed through the repository's deployment flow.
