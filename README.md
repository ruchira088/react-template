# react-template

Personal starting point for new React SPAs hosted under `ruchij.com`. Mirrors the structure of `video-downloader-front-end`: React Router 7 (SPA, no SSR), Vite, Vitest, Tailwind CSS v4 + shadcn/ui, Sentry, Axios + Zod, auth/unauth layout split, Ansible playbooks for build artefacts and Docker, multi-stage GitHub Actions pipeline, and CDK deployment via the `react-app-cdk-deploy` library.

## Using this template

After cloning, run the one-shot initializer to rename the project:

```bash
./scripts/init-template.sh <new-project-name> ["New Display Name"]
```

- `<new-project-name>` — kebab-case (e.g. `payments-ui`). Replaces every occurrence of `react-template` across `package.json`, the workflow, playbooks, CDK, app source, and tests. Must match `^[a-z][a-z0-9-]*[a-z0-9]$` so it's valid for npm names, S3 bucket suffixes, Docker tags, and ghcr.io image paths.
- `<New Display Name>` — optional Title-Case form (e.g. `"Payments UI"`). Replaces `React Template` in meta tags and the UI. Defaults to a Title-Cased version of the kebab name.

The script also derives a PascalCase form from the kebab name and substitutes that into `ReactTemplate` (only used by the CDK stack name).

The script refuses to run on a dirty working tree (so the rename is reviewable as a single diff) and deletes itself when finished. After it returns:

```bash
npm install
git add -A && git commit -m "Initialize from react-template"
```

The following are intentionally **not** rewritten — change them by hand if you want to:

- GHCR namespace `ruchira088` (in `playbooks/tasks/build-and-publish-docker-image.yml`)
- AWS account ID `365562660444` and region `ap-southeast-2` (in `.github/workflows/build-pipeline.yml`)
- Base domain `ruchij.com` (in `playbooks/s3-upload.yml`, `cdk-deploy/bin/cdk-deploy.ts`, `app/services/{Config,ApiConfiguration}.ts`)

## Manual follow-ups (the rename can't do these)

- **Sentry**: create three projects in Sentry (dev / staging / prod), copy the DSNs into `app/services/Sentry.ts`. Empty strings disable Sentry per environment.
- **Logo, loader & favicon**: replace `app/images/small-logo.svg`, `app/images/loading.svg`, and `public/favicon.ico` (all three ship as generic slate placeholders).
- **AWS IAM trust policy**: the `arn:aws:iam::<account>:role/github_iam_role` must trust this new repo's GitHub Actions OIDC subject. Update the role's trust policy to include the new repo path.
- **GitHub environments**: in the new repo's settings, create `Staging` and `Production` environments to gate the deploy jobs (matches the workflow's `environment:` keys).
- **Hosted zone**: `cdk-deploy/cdk.context.json` is intentionally omitted; the first `cdk synth` will populate it with the Route53 lookup for `ruchij.com`.

## Project layout

```
.github/workflows/build-pipeline.yml   transpile/test -> S3 upload -> docker -> cdk deploy -> release
app/
  app.css                              Tailwind v4 entrypoint + shadcn CSS variables (light/dark)
  index.scss                           HydrateFallback loading-screen styles only
  components/ui/                       shadcn primitives (Button, Input, Label)
  components/ThemeToggle.tsx           sun/moon toggle wired to the config provider
  lib/utils.ts                         `cn` helper (clsx + tailwind-merge)
  pages/authenticated/                 layout that requires a token; HomePage stub
  pages/unauthenticated/               login (working) + signup (stub) under a public layout
  providers/                           ApplicationConfigurationProvider (theme + safe-mode context, toggles `.dark` on `<html>`)
  services/
    Config.ts                          environment detection by hostname
    ApiConfiguration.ts                base API URL inference + VITE_API_URL override
    Sentry.ts                          DSN-per-env init (placeholders)
    authentication/                    login/logout/getUser via axios + Zod
    config/                            localStorage-backed app config
    http/                              axios client, 401 handler hooks AuthenticationService
    kv-store/                          generic typed localStorage abstraction
  models/                              Zod schemas for API objects
  types/                               Option, Either, Zod helpers
  utils/                               Formatter, StringUtils
cdk-deploy/                            wraps github:ruchira088/react-app-cdk-deploy
playbooks/                             ansible: s3 upload, docker build/publish, github release
scripts/
  env-vars.mjs                         injects VITE_GIT_BRANCH/VITE_GIT_COMMIT at build
  init-template.sh                     one-shot rename; deletes itself
tests/                                 mirrors app/; vitest + jsdom + testing-library
```

## Mock API for local dev

`npm run start` and `npm run build` both set `VITE_MOCK_API=true`, which swaps in `app/services/http/MockApi.ts` as the axios adapter. The three `/authentication/*` endpoints used by `AuthenticationService` are served from memory so you can sign in with any non-empty email and password — no backend required. The login page shows a small banner when the mock is active. All other API calls 404 through the adapter so missing handlers are obvious.

This is on by default so the template is demo-able with no extra setup. Once you have a real backend, drop `VITE_MOCK_API=true` from `start` and `build` in `package.json`, and use `start:dev` / `start:local` / `start:staging` (which point at concrete API URLs) for local development.

## Styling & UI

- **Tailwind v4** is wired via `@tailwindcss/vite` in `vite.config.ts`. There is no `tailwind.config.*` — design tokens live as CSS variables in `app/app.css` under `:root` and `.dark`.
- **shadcn/ui** components are owned source, not a dependency. Add more with `npx shadcn@latest add <component>`; `components.json` is already set up (`~/components/ui`, `~/lib/utils`, neutral base color).
- **Dark mode** is class-based (`.dark` on `<html>`). The toggle in `AuthenticatedLayout`'s header writes through `useApplicationConfiguration().setTheme`, which persists to localStorage and applies the class.
- **Icons** are from `lucide-react`.

## Common scripts

```bash
npm run start          # dev server with mock API (VITE_MOCK_API=true)
npm run start:dev      # dev server pointing at PROD API
npm run start:local    # dev server pointing at https://api.localhost
npm run start:staging  # dev server pointing at staging API
npm run typecheck
npm run lint
npm run test           # vitest watch
npm run test:coverage
npm run build          # react-router build (also ships VITE_MOCK_API=true)
npm run ci:checks      # typecheck + lint + test:coverage
```

## Deployment flow

1. Push to any branch -> `transpile-and-test` runs.
2. On success -> bundle uploaded to S3, Docker image pushed to ghcr.
3. Branch != `main` -> deploys to a per-branch subdomain via CDK.
4. Branch == `main` -> deploys to staging, then production (gated on GitHub environment), then creates a GitHub release.
