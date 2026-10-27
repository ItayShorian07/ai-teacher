# Development workflow

`main` is the production branch. Start each change from an updated `main` and use a short-lived branch such as `feat/signup-validation`.

1. Make one focused change.
2. Run `npm run check`.
3. Push the branch and test its Vercel Preview deployment.
4. Open a pull request and merge only after CI and Preview checks pass.

Keep functions small and names explicit. Add short English comments only when they explain a decision that the code cannot make clear. Do not commit secrets, generated output, commented-out code, or production user data.

Production uses the production Supabase project. Local and Preview deployments use the development Supabase project. Never copy production keys into Preview or local configuration.

Read [the working agreement](docs/WORKFLOW.he.md) and [code conventions](docs/CODE_STRUCTURE.he.md). Add database changes as new migrations under `database/`; preserve migrations already applied to shared databases. Regenerate `database/setup.sql` with `npm run build:database`.
