# Limud · לימוד

Bilingual AI learning POC built with Next.js 16, Supabase and Gemini.

- `/` and `/login`: email OTP login, registration link, Google sign-in when configured, public demo link.
- `/demo`: local lessons and deterministic practice without a login or AI calls.
- `/classroom`: authenticated learning with required profile fields, optional interests, AI stories/questions, PDF transcription and Pro coaching.
- `/account`: profile editing, sign-out and explicit account deletion.
- `/contact`: contact information and FAQs.

A persistent light/dark switch is available in the authentication and classroom headers.

## Current connection status

Use `npm run check:connections` for current configuration and database checks. Credentials belong in the ignored `.env.local` file and the hosting environment, never in `.env.example`. A successful configuration check does not replace end-to-end verification of email delivery, OAuth, data isolation or deletion. The site disables auth controls when the required profile schema or Turnstile configuration is unavailable.

Read the full [implementation and connection report in Hebrew](docs/IMPLEMENTATION_STATUS.he.md). It maps every requested feature, explains bot protection and lists exact activation steps and limitations.

## Setup

Use Node 22 or newer. Install with `npm ci`, configure `.env.local` using `.env.example`, and run `npm run dev`.

Apply [`database/setup.sql`](database/setup.sql) in Supabase SQL Editor. **One Supabase Postgres database is enough**, with pgvector collections for approved material, question/rubric data and generated-content caching. No additional vector database service is required.

Set up Google OAuth, custom SMTP/OTP delivery and Turnstile in the provider dashboards. AI endpoints require a verified email, complete profile, signed human-verification cookie and distributed database quota. Secrets stay server-side. Pro is granted manually through `entitlements`; client metadata cannot grant it.

The PDF workflow transcribes an answer up to 3MB, lets the student review it and submits the reviewed text. PDFs are not stored by the application. The Pro assistant reviews code but does not execute it. Session progress currently resets on reload; durable attempts/mastery and sandboxed execution remain separate future features.

## Validation

```sh
npm test
npm run typecheck
npm run build
node scripts/check-connections.mjs
```

For local route checks, run `npm run dev -- --port 3100`, then `node scripts/check-routes.mjs`. Tests cover the demo checker, auth validation, same-account phone verification, signed bot-proof expiry/tampering, AI input validation and PDF bounds. Live integration tests require configured external services.

GitHub: https://github.com/ItayShorian07/ai-teacher

Existing deployment: https://ai-teacher-three-pied.vercel.app. Local edits are not deployed automatically until pushed through the repository's deployment flow.
