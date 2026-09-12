# Limud · לימוד

A bilingual AI teacher **demo** for Israeli primary (grades 4–6), middle (7–9), and high school (10–12). Mathematics, computer science, and a short learning-with-AI course.

## Public site and account setup

The public production site is https://ai-teacher-three-pied.vercel.app.

New bilingual routes: `/login`, `/register`, `/account/complete`, and `/account`. The Supabase integration supports Google OAuth, email OTP sign-in/registration, profile storage, and same-account SMS phone verification. **No Supabase project or delivery providers have been configured yet.** Registration stays visibly disabled until the environment variables are supplied; the classroom demo stays public.

Apply `database/002_profiles.sql` to a new Supabase project and follow [the setup guide in Hebrew](docs/AUTH_SETUP.he.md) for Google, SMTP, SMS, Vercel environment variables, and the remaining live verification checks. Never use a secret/service_role key in a `NEXT_PUBLIC_` variable. Profiles are separate from the future two vector collections.

## Run

Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. No keys or external accounts are required. For production locally: `npm run build && npm start`. For restricted macOS file watchers, use `WATCHPACK_POLLING=true npm run dev -- --webpack`.

## Try the core experience

1. Pick a subject and school stage. Switch between English and Hebrew from the header. Hebrew uses RTL; equations/code remain LTR.
2. Choose football, gaming, music, or space to personalize the story.
3. Open **Try it yourself**. The first middle-school mathematics question is `3x + 6 = 21`.
4. With **Coach as I solve** on, enter `3x = 27` and press Enter or **Check my step**. The tutor pauses the question, preserves your draft, explains balancing equations, and asks `y + 4 = 11`.
5. Answer `7` in the recovery check. Return to the saved work, replace it with `3x = 15`, check, then enter `x = 5`.
6. Turn coaching off to receive feedback only on submission. In either mode, hints are available.
7. Difficulty increases after pairs of independently solved questions. Use **My progress** for the session recap.

## What is real in this prototype

- Interactive Hebrew and English classroom with mobile layouts.
- Original lessons personalized by a fixed set of hobbies.
- Nine subject/stage combinations, three practice levels, five exercise variants per level.
- Deterministic arithmetic/equation grading with equivalent-step checks and clarification for unsupported notation.
- Pause → teach prerequisite → recovery question → resume original answer.
- Session progress, solved-with-support feedback, and locally saved learning preferences.

## What is simulated or deferred

**No LLM calls, embeddings, or vector database connections are active.** Stories are curated templates; questions are generated from original exercise templates. `/api/tutor` is a reserved server boundary and returns 503. The live option is disabled. The demo does not claim official Israeli curriculum alignment or present its exercises as real Bagrut questions.

The computer science demo checks numeric outputs and tracing; it does not execute student code. The learning-with-AI demo teaches prompting, verification, and privacy, with numerical fact-check exercises. Written-response grading, a full course, durable learning records, analytics, and production safeguarding remain phase 2. Account authentication and profile storage are implemented behind Supabase configuration; live provider testing is still pending. The demo stores only school stage, subject, language, and selected hobby in localStorage. Answers and progress remain in browser memory and reset on refresh/profile changes.

## Two vector stores for phase 2

`database/schema.sql` defines **separate material and question collections**, plus private answer rubrics. These can be two tables in one Supabase project or physically separate projects using the two sets of environment variables in `.env.example`. No database has been provisioned. The schema is prepared but has not been executed against Supabase.

Planned flow:

1. Ingest approved material: extract text/OCR, chunk by concept, embed, retain source page and language/grade/topic metadata. Teacher review is required before inclusion.
2. Retrieve material → produce a hobby-based story with source citations.
3. Generate easy questions with the LLM; retrieve approved exam questions only when demonstrated mastery and exam track permit it. Keep answer rubrics server-side.
4. Validate committed steps with deterministic math checks and the LLM. Ask for clarification when uncertain. In CS, run sandboxed tests in an isolated execution service, not arbitrary Python in a Vercel function.
5. Detect a misconception → retrieve its prerequisite lesson → ask a separate mastery check → return to the original question.
6. Save mastery and use it for spaced review. Add authenticated server routes, durable rate limits, request/output validation and cost limits before any public live deployment.

Schema uses `vector(1536)` as an initial embedding dimension. Choose and freeze an embedding model before ingestion; document and query vectors must use the same model/version. Retrieval filters run inside SQL before ranking. Exam rows require provenance fields, and only approved rows are returned. Source content is treated as data, never as instructions.

Reference documentation: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [OpenAI embeddings](https://developers.openai.com/api/docs/guides/embeddings), [Supabase semantic search](https://supabase.com/docs/guides/ai/semantic-search), [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## Recommended next teaching tools

- **Prerequisite diagnostic:** find the missing building block before a lesson.
- **Spaced practice and a mistake notebook:** revisit concepts after a delay using the learner's actual errors.
- **Teach it back:** ask students to explain a concept in their own words and check understanding.
- **Code playground:** step through loops, inspect variables, and run friendly test cases.
- **Teacher view:** review progress, recurring misconceptions, and source approval.
- **Voice and accessible math input:** Hebrew/English read-aloud and handwritten-math capture, with confirmation before grading recognized handwriting.

## GitHub and Vercel

Repository: https://github.com/ItayShorian07/ai-teacher

Vercel is connected to this repository’s main branch and deploys updates automatically. Demo mode requires no environment variables. To activate accounts, complete docs/AUTH_SETUP.he.md and redeploy. Live AI remains a separate unfinished integration; adding auth keys does not enable it.

Official guides: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [Git deployments](https://vercel.com/docs/git).

## Validation

`npm test` checks generated answers across 540 track/hobby/level/variant combinations, equation equivalence, malformed notation, arithmetic precedence, and recovery answers. Auth tests additionally cover required fields, phone normalization, both-channel verification and rejecting a mismatched verified phone. Live Google, email and SMS flows require provider configuration and have not been exercised. `npm run build` validates TypeScript and creates the Next.js production build. GitHub Actions runs these checks on pushes and pull requests.

## Open product decisions

- Whether to extend primary coverage to grades 1–3.
- First official curriculum corpus and permission to use textbook/exam material.
- Mathematics tracks (3/4/5 units), CS language (Python/Java/C#), and grade-specific mapping.
- LLM provider/model and whether the two vector stores require physical isolation.
- Student/teacher/parent accounts, privacy/consent, retention, and which live interruption behaviors to pilot.
