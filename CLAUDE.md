# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A personal template for new React SPAs hosted under `ruchij.com`. New projects are stamped out with `./scripts/init-template.sh <kebab-name> ["Display Name"]`, which rewrites every occurrence of `react-template` / `React Template` / `ReactTemplate` and then deletes itself. Keep the codebase generic and demo-able with no backend (see mock API below).

## Commands

```bash
npm run start                # dev server with in-memory mock API (VITE_MOCK_API=true)
npm run typecheck            # react-router typegen + tsc
npm run lint                 # oxlint over app/ and tests/ (config in .oxlintrc.json)
npm run test                 # vitest watch mode
npm run test:run             # vitest single pass
npm run ci:checks            # typecheck + lint + test:coverage (what CI runs)
npx vitest run tests/services/AuthenticationService.test.ts   # single test file
npx vitest run -t "test name"                                 # single test by name
```

Every commit auto-bumps the patch version in `package.json` and `package-lock.json` via the checked-in `.githooks/pre-commit` hook (activated by the `prepare` script). A manually staged change to `"version"` suppresses the auto-bump.

## Dependencies

Node 24 (`engines.node: ^24.0.0`). The load-bearing versions: React 19.2, React Router 8.3 (`react-router` + `@react-router/dev`), Vite 8.2, Vitest 4.1 + jsdom 30, TypeScript 7.0, oxlint 1.79, Tailwind 4.3 (`tailwindcss` + `@tailwindcss/vite`), Zod 4.4, axios 1.19, Luxon 3.7, `@sentry/react` 10.70. Testing Library (`react` 16.3, `jest-dom` 7, `user-event` 14.6). `sass-embedded` compiles `app/index.scss`; `simple-git` powers `scripts/env-vars.mjs`. `@types/node` is deliberately held on the 24 line (in both `package.json` files) to track `engines.node` — don't bump it to 26 while the runtime is Node 24. shadcn's runtime deps are `@radix-ui/react-label`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `lucide-react`.

`cdk-deploy/` has its own `package.json` (installed separately): `aws-cdk` 2.x, `react-app-cdk-deploy` from GitHub, and `tsx` — not `ts-node`, which needs the removed TS compiler API.

The dependency list is kept minimal — every runtime dependency is imported by `app/` or required by the build. `@dnd-kit/*`, `classnames` and `@react-router/node` were removed as unused; `@react-router/node` is still resolvable transitively via `@react-router/dev`. Use `cn` from `~/lib/utils` rather than reintroducing `classnames`.

`isbot` is the exception: no source file imports it, but **`react-router typegen` will silently rewrite `package.json` to re-add it** (as a bare `"isbot": "^5"`, appended out of sorted order) and run an install that prunes `devDependencies`, which leaves `node_modules` broken until the next `npm install`. Don't remove it. If it does get re-added, restore the pinned `^5.2.1` in sorted position and re-run `npm install`.

**When you change a dependency — add, remove, or bump a version — update `README.md` in the same change.** Its `## Dependencies` section lists every package with its version range, and the intro paragraph and `## Toolchain notes` section name specific versions too. Grep `README.md` for the old version string before finishing.

## Toolchain constraints

Two deliberate choices here are unusual enough to break assumptions. Read this before adding any TypeScript-aware tooling.

- **TypeScript 7 is the native (Go) compiler.** `tsc` is a native binary, and the `typescript` npm package no longer exports the classic compiler API — `require("typescript")` gives you `{version, versionMajorMinor}` and nothing else. `createProgram`, `SyntaxKind` etc. now live behind a new, different `typescript/unstable/*` surface. So **any tool that consumes the old TS API will fail on install or at runtime**, not merely warn. If you genuinely need such a tool, the escape hatch is Microsoft's documented side-by-side layout — `"typescript": "npm:@typescript/typescript6@^6.0.2"` (ships its binary as `tsc6`) alongside `"@typescript/native": "npm:typescript@^7.0.2"` (owns `tsc`) — but that reintroduces TS 6 into the tree, so prefer a TS 7-native tool.
- **Linting is oxlint, not ESLint** (`.oxlintrc.json`; there is no `eslint.config.js`). oxlint is Rust-based and never touches the TS compiler API, which is what makes it compatible with TS 7. Consequences:
  - `typescript-eslint` **cannot** be added — every version caps TypeScript at `<6.1.0` and hard-errors on TS 7. Tracking: typescript-eslint#10940. The whole ESLint stack was removed for this reason.
  - There are **no type-aware lint rules**, and there never were in this template. `tsc` is the sole source of truth for types.
  - Rule names are plugin-prefixed (`typescript/no-unused-vars`, `no-empty`). oxlint's `correctness` category replaces `eslint:recommended` + `tseslint:recommended`; coverage is close but not identical. The `typescript` / `unicorn` / `oxc` plugins are on; `react` is off by default.
  - Unused variables and args are ignored when prefixed with `_` (`argsIgnorePattern` / `varsIgnorePattern`). Under `tests/**`, unused-vars is a warning and `no-explicit-any` is off.

## Architecture

- **React Router 8 SPA, no SSR** (`ssr: false` in `react-router.config.ts`). All routes are declared in `app/routes.ts` using two layouts: `pages/authenticated/AuthenticatedLayout.tsx` (checks the stored token on mount, validates it against the API, redirects to `/sign-in?redirect=...` on failure) and `pages/unauthenticated/UnauthenticatedLayout.tsx` (sign-in / sign-up).
- **Path alias**: `~/*` maps to `app/*`, declared once in `tsconfig.json` and resolved by Vite natively via `resolve: { tsconfigPaths: true }` — set in **both** `vite.config.ts` and `vitest.config.ts`. There is no `vite-tsconfig-paths` plugin; if you add another Vite-based config, it needs that `resolve` block too or `~/` imports won't resolve.
- **Functional style**: `app/types/Option.ts` and `Either.ts` are used pervasively instead of null checks (`maybeToken.fold(...)`). API objects are Zod schemas in `app/models/`, parsed with `zodParse` from `app/types/Zod.ts`.
- **HTTP layer**: single axios instance in `app/services/http/HttpClient.ts`. Base URL comes from `app/services/ApiConfiguration.ts` (inferred from hostname, overridable with `VITE_API_URL`). A response interceptor removes the stored auth token on any 401. When `VITE_MOCK_API=true` (default for `start` and `build`), `MockApi.ts` is installed as the axios adapter: the three `/authentication/*` endpoints are served from memory (any non-empty credentials work) and everything else 404s so missing handlers are obvious.
- **Persistence**: `app/services/kv-store/KeyValueStore.ts` is a typed localStorage abstraction (`KeySpace` with key/value codecs). The auth token and app config are stored through it, not via raw `localStorage`.
- **Theme/config**: `ApplicationConfigurationProvider` holds theme + safe-mode context, persists via the config service, and toggles the `.dark` class on `<html>`.
- **Styling**: Tailwind v4 via `@tailwindcss/vite` — there is no `tailwind.config.*`; design tokens are CSS variables in `app/app.css` under `:root` and `.dark`. shadcn/ui components are owned source in `app/components/ui/` (add more with `npx shadcn@latest add <component>`; `components.json` is configured).
- **Tests**: `tests/` mirrors `app/` one-to-one; vitest + jsdom + Testing Library with globals enabled and setup in `tests/setup.ts`. Coverage only counts `app/**`.
- **Deployment**: GitHub Actions (`.github/workflows/build-pipeline.yml`) → Ansible playbooks (`playbooks/`) for S3 upload and Docker/ghcr publish → CDK (`cdk-deploy/`, wraps `react-app-cdk-deploy`). Non-`main` branches deploy to per-branch subdomains; `main` goes staging → production → GitHub release. `cdk-deploy/` is excluded from vitest.

## Intentionally hardcoded

The GHCR namespace (`ruchira088`), AWS account/region, and base domain (`ruchij.com`) are deliberately not templated by `init-template.sh` — don't "fix" them into variables.
