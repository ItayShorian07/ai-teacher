<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project working agreement

- Read `docs/WORKFLOW.he.md` before changing the project. Use small feature or fix branches and pull requests into `main`.
- Follow `docs/CODE_STRUCTURE.he.md` for component boundaries and naming. Preserve database and API field names during internal refactors.
- Local development and Vercel Preview use non-production services. Production uses separate Supabase, Turnstile and Gemini credentials. Never copy production users or secrets into a test environment.
- Keep `config/environments.json` accurate. It contains public environment identifiers, never secrets. Do not bypass environment checks to make a deployment pass.
- Prefer simple functions, clear names and explicit types at external boundaries. Validate untrusted input on the server. Keep secrets and privileged clients server-side.
- Write readable, formatted code. Add short, plain English comments only when they explain a decision or constraint. Avoid obvious comments, unnecessary abstractions and unrelated refactors.
- Preserve existing user changes. Do not commit, push, merge or deploy unless the user asks for that action.
- Run `npm run check` before considering a code change ready. Add focused tests for behavior changes, especially authentication, authorization and environment isolation. Report checks that could not run.
- Record database changes in new numbered SQL migration files. Test them on non-production first; do not rewrite migrations already applied to a shared database.
- Review the diff for secrets and accidental user data. Keep dependency changes intentional and commit the lockfile with them.
