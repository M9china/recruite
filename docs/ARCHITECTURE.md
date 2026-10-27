# Architecture

The full Milestone 1 plan (requirements, design system, POPIA approach, open client questions) lives in the
shared planning doc. This file records the decisions that shape the code.

## Layers

```
Browser ──> src/app (pages, /api/public/v1 handlers)
              │  parse with Zod, rate limit, bot check, map errors
              ▼
          src/server/services      business rules, transactions
              │
              ▼
          src/server/repositories  Prisma queries only
              │
              ▼
          PostgreSQL     + email provider (via outbox)   + private object storage
```

Phase 2 adds an `(admin)` route group and `/api/admin/v1` handlers behind authentication. They call the same
services, so nothing below the route layer is rewritten.

## Key decisions

| Decision | Why |
| --- | --- |
| Domain rules in `src/lib/domain` with no dependencies | Pages and the submit service share one definition of "open", so the UI never offers what the server rejects |
| Transactional email outbox | An application is never lost because an email failed; delivery retries after commit |
| `idempotencyKey` + unique (applicant, opportunity) | Absorbs double-submits and blocks duplicate applications at the database |
| `ApplicationStatusChange` written from day one | Phase 2 gets a complete audit trail, including the initial `SUBMITTED` |
| Random, non-sequential references | Easy to read aloud, reveals nothing about volume |
| Env validated on first use, not at import | Builds succeed before every Phase 1 secret exists |
| Optional personal fields omitted | POPIA minimality; added by migration only when the client confirms need |
| Next.js 15 + Prisma 6 | Stable, well-documented configuration; upgrade to newer majors as a separate, tested change |

## Not in Phase 1

Admin UI, admin authentication, any endpoint that reads submitted applications, applicant status lookup.
