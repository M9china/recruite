# Recruitment Platform

Public recruitment website and application backend (Phase 1).
Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma 6 · Zod 4 · Vitest · Playwright · Vercel.

> **Status:** public site and online application built. Pages read content from PostgreSQL through
> `src/server/services/content.ts`. Applicants complete a 7-step questionnaire with a photo and supporting
> documents, which is validated and saved on the server (see [docs/API.md](docs/API.md)). Still to do: sending the
> queued confirmation emails, a working contact form, and Turnstile bot checks. A banner marks the site as draft
> until `site.contentApproved` is set.

## Editing draft content

| File | Contains | Where it lives |
| --- | --- | --- |
| `src/content/site.ts` | Organisation name, hero and about copy, contact details, verified stats, navigation | Code |
| `src/content/recruitment.ts` | Benefits and process steps | Code |
| `src/content/legal.ts` | Legal page outlines and `PRIVACY_NOTICE_VERSION` | Code |
| `prisma/seed-data/careers.ts` | Career fields and roles, with opening and closing dates | Database (via seed) |
| `prisma/seed-data/records.ts` | Eligibility, FAQs, announcements | Database (via seed) |

The seed is for development only. Run `SEED_SAMPLE_CONTENT=true npm run db:seed` after editing the seed files.
Production content will be managed through the Phase 2 dashboard (or entered directly in the database until then).

Photos: add licensed images under `public/images/` and set `image: { src, alt }` on a category (or pass `image`
to `Hero`). Until then each photo position shows a placeholder describing the shot it needs.

## Quick start

Requirements: Node 22 (see `.nvmrc`) and a PostgreSQL 15+ database.

```bash
npm install                      # also runs `prisma generate`; commit the generated package-lock.json
cp .env.example .env.local       # then edit the values
cp .env.local .env               # Prisma CLI reads .env
npm run db:deploy                # apply migrations
SEED_SAMPLE_CONTENT=true npm run db:seed   # draft roles and content, so the site and form have data
npm run dev                      # http://localhost:3000
```

A local database with Docker:

```bash
docker run -d --name recruitment-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=recruitment postgres:16
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run check` | Typecheck + lint + unit tests (run before every push) |
| `npm test` | Vitest unit and integration tests |
| `npm run test:e2e` | Playwright tests on desktop and mobile viewports |
| `npm run build` | Production build |
| `npm run db:migrate -- --name <change>` | Create a new migration after editing `schema.prisma` |
| `npm run db:deploy` | Apply pending migrations (used in production) |
| `npm run db:check-drift` | Fail if `schema.prisma` and the migrations disagree |
| `npm run db:seed` | Insert sample content (dev only, needs `SEED_SAMPLE_CONTENT=true`) |
| `npm run db:studio` | Browse the database locally |

## Project layout

```
prisma/              schema, migrations, dev seed
src/app/             routes only: pages and thin API handlers
src/components/      ui/ (primitives), layout/ (header, footer), sections/ (page blocks)
src/server/          server-only code: db client, env, services, repositories, email, storage, security, logging
src/lib/domain/      pure business rules (statuses, references, opening windows), shared by UI and server
src/lib/validation/  Zod schemas shared by forms and API handlers
src/content/         static copy awaiting client approval
tests/               unit/, integration/, e2e/
docs/                architecture, deployment
```

Rules of the codebase:

- Route handlers parse input, call a service and map errors. Business logic lives in `src/server/services`.
- Only `src/server/repositories` talks to Prisma.
- Anything under `src/server` imports `server-only`, so it can never be bundled into the browser.
- Errors leave the server only through `toErrorResponse()` in `src/lib/errors.ts`.
- Log with `src/server/logging/logger.ts`, which redacts personal data. `console.log` is a lint error.
- No content (careers, requirements, contact details) is invented: it comes from the database or `src/content`, marked as draft until approved.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Vercel + managed Postgres setup, environment variables and the release checklist.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request against a real Postgres: schema validation,
migrations, drift check, typecheck, lint, unit tests, production build and Playwright end-to-end tests.
