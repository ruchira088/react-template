# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A personal template for new React SPAs hosted under `ruchij.com`. New projects are stamped out with `./scripts/init-template.sh <kebab-name> ["Display Name"]`, which rewrites every occurrence of `react-template` / `React Template` / `ReactTemplate` and then deletes itself. Keep the codebase generic and demo-able with no backend (see mock API below).

## Commands

```bash
npm run start                # dev server with in-memory mock API (VITE_MOCK_API=true)
npm run typecheck            # react-router typegen + tsc
npm run lint                 # eslint over app/ and tests/
npm run test                 # vitest watch mode
npm run test:run             # vitest single pass
npm run ci:checks            # typecheck + lint + test:coverage (what CI runs)
npx vitest run tests/services/AuthenticationService.test.ts   # single test file
npx vitest run -t "test name"                                 # single test by name
```

Every commit auto-bumps the patch version in `package.json` and `package-lock.json` via the checked-in `.githooks/pre-commit` hook (activated by the `prepare` script). A manually staged change to `"version"` suppresses the auto-bump.

## Architecture

- **React Router 7 SPA, no SSR** (`ssr: false` in `react-router.config.ts`). All routes are declared in `app/routes.ts` using two layouts: `pages/authenticated/AuthenticatedLayout.tsx` (checks the stored token on mount, validates it against the API, redirects to `/sign-in?redirect=...` on failure) and `pages/unauthenticated/UnauthenticatedLayout.tsx` (sign-in / sign-up).
- **Path alias**: `~/*` maps to `app/*` (tsconfig + vite-tsconfig-paths).
- **Functional style**: `app/types/Option.ts` and `Either.ts` are used pervasively instead of null checks (`maybeToken.fold(...)`). API objects are Zod schemas in `app/models/`, parsed with `zodParse` from `app/types/Zod.ts`.
- **HTTP layer**: single axios instance in `app/services/http/HttpClient.ts`. Base URL comes from `app/services/ApiConfiguration.ts` (inferred from hostname, overridable with `VITE_API_URL`). A response interceptor removes the stored auth token on any 401. When `VITE_MOCK_API=true` (default for `start` and `build`), `MockApi.ts` is installed as the axios adapter: the three `/authentication/*` endpoints are served from memory (any non-empty credentials work) and everything else 404s so missing handlers are obvious.
- **Persistence**: `app/services/kv-store/KeyValueStore.ts` is a typed localStorage abstraction (`KeySpace` with key/value codecs). The auth token and app config are stored through it, not via raw `localStorage`.
- **Theme/config**: `ApplicationConfigurationProvider` holds theme + safe-mode context, persists via the config service, and toggles the `.dark` class on `<html>`.
- **Styling**: Tailwind v4 via `@tailwindcss/vite` — there is no `tailwind.config.*`; design tokens are CSS variables in `app/app.css` under `:root` and `.dark`. shadcn/ui components are owned source in `app/components/ui/` (add more with `npx shadcn@latest add <component>`; `components.json` is configured).
- **Tests**: `tests/` mirrors `app/` one-to-one; vitest + jsdom + Testing Library with globals enabled and setup in `tests/setup.ts`. Coverage only counts `app/**`.
- **Deployment**: GitHub Actions (`.github/workflows/build-pipeline.yml`) → Ansible playbooks (`playbooks/`) for S3 upload and Docker/ghcr publish → CDK (`cdk-deploy/`, wraps `react-app-cdk-deploy`). Non-`main` branches deploy to per-branch subdomains; `main` goes staging → production → GitHub release. `cdk-deploy/` is excluded from vitest.

## Intentionally hardcoded

The GHCR namespace (`ruchira088`), AWS account/region, and base domain (`ruchij.com`) are deliberately not templated by `init-template.sh` — don't "fix" them into variables.
