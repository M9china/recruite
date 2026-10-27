# Deployment

The app runs on **Vercel** with a **managed PostgreSQL** database. Recommended: Neon (Vercel integration,
database branching for previews) or Supabase. Choose a database region close to the Vercel function region;
`vercel.json` pins functions to `cpt1` (Cape Town). If your database is elsewhere, change the region to match it,
because every request makes database round trips.

## 1. First-time setup

1. **Generate the lockfile.** Run `npm install` locally and commit `package-lock.json`.
2. **Push to GitHub** and confirm the CI workflow passes.
3. **Create the database** (production) and note two connection strings:
   - pooled → `DATABASE_URL` (Neon: the `-pooler` host)
   - direct → `DIRECT_URL` (used only by migrations)
4. **Import the repo in Vercel** (Add New → Project). The framework, build command (`npm run vercel-build`)
   and region are read from `vercel.json`.
5. **Set environment variables** (below) for Production and Preview.
6. **Deploy.** The build runs `prisma migrate deploy` before `next build`, so the schema is always current.
7. **Verify:** open `https://<domain>/api/health`; it should return `{"status":"ok","database":"ok",…}`.

## 2. Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled connection string |
| `DIRECT_URL` | Yes | Direct connection string for migrations |
| `APP_BASE_URL` | Yes | e.g. `https://careers.example.org`, no trailing slash |
| `EMAIL_PROVIDER` | Milestone 4 | `resend` in production; `console` is rejected in production |
| `EMAIL_FROM`, `EMAIL_STAFF_INBOX`, `RESEND_API_KEY` | Milestone 4 | Sending domain must have SPF/DKIM set up |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Milestone 4 | Bot protection for forms |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Milestone 4 | Rate limiting |
| `CRON_SECRET` | Milestone 4 | Protects the email-retry cron route |
| `STORAGE_*` | If uploads approved | Private bucket only |
| `SHADOW_DATABASE_URL` | CI / local only | Never needed on Vercel |

Only variables prefixed `NEXT_PUBLIC_` reach the browser. Never put a secret behind that prefix.

## 3. Preview deployments

Every deploy runs migrations, **so previews must not use the production database.** Either:

- use the Neon Vercel integration, which creates a database branch per preview, or
- set a separate staging `DATABASE_URL` / `DIRECT_URL` for the Preview environment.

## 4. Changing the schema

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate -- --name describe_change` to generate the SQL.
3. Review the SQL. For destructive changes (dropping or renaming columns), split into
   expand → backfill → contract releases.
4. Commit both files. CI's drift check fails if they disagree.

## 5. Backups and recovery

- Enable point-in-time recovery on the database (Neon and Supabase both offer it on paid plans); keep at least 7 days.
- Take a logical backup before each production migration: `pg_dump "$DIRECT_URL" -Fc -f pre-migration.dump`.
- Test a restore into a scratch database at least once per quarter and record the result.
- Backups contain personal information: store them encrypted, in the same jurisdiction, with restricted access.

## 6. Monitoring

- Point an uptime monitor at `/api/health` (expects 200; 503 means the database is unreachable).
- Add Sentry (`@sentry/nextjs`) before launch for error tracking; configure it to scrub request bodies.
- Vercel logs carry the structured JSON from `src/server/logging/logger.ts`; search by `event` or `requestId`.

## 7. Release checklist

- [ ] CI green on `main`
- [ ] All required environment variables set for Production
- [ ] Production database backed up; PITR enabled
- [ ] `/api/health` returns ok after deploy
- [ ] Custom domain with HTTPS; `APP_BASE_URL` matches it
- [ ] Email sending domain verified (SPF, DKIM, DMARC)
- [ ] Legal pages approved by the client; privacy notice version updated
- [ ] `robots` set to index in `src/app/layout.tsx` only when the client approves launch
- [ ] Test application submitted end-to-end on production, then removed
