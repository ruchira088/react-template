# react-template

Personal starting point for new React SPAs hosted under `ruchij.com`. Mirrors the structure of `video-downloader-front-end`: React Router 7 (SPA, no SSR), Vite, Vitest, MUI, SCSS, Sentry, Axios + Zod, auth/unauth layout split, Ansible playbooks for build artefacts and Docker, multi-stage GitHub Actions pipeline, and CDK deployment via the `react-app-cdk-deploy` library.

## Creating a new project from this template

```bash
# 1. clone, drop the template's git history
git clone git@github.com:ruchira088/react-template.git my-app
cd my-app
rm -rf .git

# 2. answer the prompts; the script does find/replace across all text files
node scripts/init-project.mjs

# 3. regenerate the lockfile against the renamed package.json
npm install

# 4. clean up
rm scripts/init-project.mjs
git init -b main && git add -A && git commit -m "Initial commit from react-template"
```

The init script asks for:

| Token | Default | Notes |
| --- | --- | --- |
| `__PROJECT_NAME__` | — | kebab-case, drives npm name, S3 bucket, ghcr image |
| `__PROJECT_TITLE__` | derived from name | display title in `<head>` and login page |
| `__PROJECT_DESCRIPTION__` | derived | meta description |
| `__SUBDOMAIN__` | = name | production becomes `<sub>.ruchij.com`, staging becomes `staging.<sub>.ruchij.com` |
| `__API_HOSTNAME_PROD__` | `api.<sub>.ruchij.com` | backend hostname for prod |
| `__API_HOSTNAME_STAGING__` | `api.staging.<sub>.ruchij.com` | backend hostname for staging |
| `__STACK_NAME__` | `<Pascal>FrontEndStack` | CDK stack name |
| `__GHCR_NAMESPACE__` | `ruchira088` | github container registry org/user |
| `__AWS_ACCOUNT__` | `365562660444` | for the OIDC role ARN |
| `__AWS_REGION__` | `ap-southeast-2` | |

## Manual follow-ups (init script can't do these)

- **Sentry**: create three projects in Sentry (dev / staging / prod), copy the DSNs into `app/services/Sentry.ts`. Empty strings disable Sentry per environment.
- **Logo & favicon**: replace `app/images/small-logo.svg` and `public/favicon.ico`.
- **AWS IAM trust policy**: the `arn:aws:iam::<account>:role/github_iam_role` must trust this new repo's GitHub Actions OIDC subject. Update the role's trust policy to include the new repo path.
- **GitHub environments**: in the new repo's settings, create `Staging` and `Production` environments to gate the deploy jobs (matches the workflow's `environment:` keys).
- **Hosted zone**: `cdk-deploy/cdk.context.json` is intentionally omitted; the first `cdk synth` will populate it with the Route53 lookup for `ruchij.com`.

## Project layout

```
.github/workflows/build-pipeline.yml   transpile/test -> S3 upload -> docker -> cdk deploy -> release
app/
  pages/authenticated/                 layout that requires a token; HomePage stub
  pages/unauthenticated/               login (working) + signup (stub) under a public layout
  providers/                           ApplicationConfigurationProvider (theme + safe-mode context)
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
  init-project.mjs                     this file's prompts; delete after running
tests/                                 mirrors app/; vitest + jsdom + testing-library
```

## Common scripts

```bash
npm run start          # dev server pointing at PROD API
npm run start:local    # dev server pointing at https://api.localhost
npm run start:staging  # dev server pointing at staging API
npm run start:dev      # dev server, no API URL override (uses inference)
npm run typecheck
npm run lint
npm run test           # vitest watch
npm run test:coverage
npm run build          # react-router build
npm run ci:checks      # typecheck + lint + test:coverage
```

## Deployment flow

1. Push to any branch -> `transpile-and-test` runs.
2. On success -> bundle uploaded to S3, Docker image pushed to ghcr.
3. Branch != `main` -> deploys to a per-branch subdomain via CDK.
4. Branch == `main` -> deploys to staging, then production (gated on GitHub environment), then creates a GitHub release.
