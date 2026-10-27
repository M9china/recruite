# Public API

Base path: `/api/public/v1`. All responses are JSON and `Cache-Control: no-store`. Every response carries an
`X-Request-Id` header; quote it when investigating a problem.

Errors always have this shape:

```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Some answers need correcting.", "requestId": "…",
             "fieldErrors": { "questionnaire.personal.surname": ["Enter your surname"] } } }
```

| Code | Status | Meaning |
| --- | --- | --- |
| `VALIDATION_FAILED` | 400 | Input failed validation; `fieldErrors` keys are dotted paths into the request body |
| `BOT_CHECK_FAILED` | 400 | Honeypot field was filled in |
| `FORBIDDEN` | 403 | Cross-site request (Origin does not match the site) |
| `OPPORTUNITY_CLOSED` | 409 | The role is not accepting applications now |
| `DUPLICATE_APPLICATION` | 409 | This email address has already applied for this role |
| `PAYLOAD_TOO_LARGE` | 413 | File over 4 MB, or request body too large |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | File content is not an allowed type |
| `RATE_LIMITED` | 429 | Too many requests; see the `Retry-After` header |
| `INTERNAL` | 500 | Unexpected error; details are logged, never returned |

All POST endpoints reject requests whose `Origin` header names another site.

## POST /uploads

`multipart/form-data` with:

| Field | Value |
| --- | --- |
| `file` | The file. Maximum 4 MB (Vercel's request limit is 4.5 MB). |
| `documentType` | `PHOTO`, `IDENTITY_DOCUMENT`, `QUALIFICATION` or `OTHER` |

The file type is decided by reading the file's first bytes, not its name or declared type. `PHOTO` accepts JPEG
or PNG; other types also accept PDF. Everything else is rejected, including executables renamed to `.jpg`.

`201` response:

```json
{ "token": "43-character secret", "documentType": "PHOTO", "filename": "photo.jpg", "size": 48213, "mimeType": "image/jpeg" }
```

The file is stored privately under a random key. Only a SHA-256 hash of `token` is stored, so the token is the only
way to attach this file to an application. Unattached uploads expire after 24 hours.

Rate limit: 30 uploads per 15 minutes per client.

## POST /applications

`application/json`, validated by `SubmissionSchema` in `src/lib/validation/application.ts`:

```jsonc
{
  "opportunitySlug": "supply-chain-clerk",
  "idempotencyKey": "uuid generated once per form session",
  "documentTokens": ["token from /uploads", "…"],          // exactly one PHOTO required, up to 8 files
  "declarations": { "truthful": true, "matchesDocuments": true, "privacyNotice": true },
  "questionnaire": {
    "personal": {
      "surname": "…", "firstName": "…", "middleName": "…optional",
      "maritalStatus": "MARRIED | NEVER_MARRIED | DIVORCED | SEPARATED | WIDOWED | CIVIL_PARTNERSHIP | CIVIL_PARTNERSHIP_ENDED",
      "spouse": { "birthCountry": "…", "birthCity": "…", "citizenship": "…" }   // required if MARRIED, SEPARATED or CIVIL_PARTNERSHIP
    },
    "parents": {
      "father": { "has": "YES | NO", "details": { "surname", "firstNames", "middleName?", "dateOfBirth": "YYYY-MM-DD", "placeOfBirth" } },
      "mother": { "…same…" }                                                   // details required if has = YES
    },
    "residence": {
      "status": "YES | NONE",
      "address": { "country", "postalCode", "city", "street", "building", "apartment?" }   // required if YES
    },
    "contact": { "phones": ["1 to 5"], "emails": ["1 to 3; the first is used for contact"] },
    "work": {
      "status": "YES | NO | NEVER",
      "history": [ { "organisation", "role", "address", "from": "YYYY-MM", "to": "YYYY-MM or omitted for present" } ]  // 1–5 if YES
    }
  }
}
```

Conditional details are discarded when they don't apply (for example, `father.details` when `has` is `NO`), so
only answers the applicant actually gave are stored.

`201` response: `{ "referenceNumber": "APP-2026-7K4Q-9XMD" }`

Guarantees:

- Nothing is saved unless the whole transaction commits. The transaction covers the applicant, application,
  first status-history entry, document attachment and queued confirmation email.
- Repeating a request with the same `idempotencyKey` returns the original reference instead of a second application.
- The role's open and close dates are checked on the server at the moment of submission.
- The answers are stored with `formVersion` and the accepted `privacyNoticeVersion`.

Rate limit: 10 submissions per hour per client.

There is deliberately **no** endpoint for reading submitted applications. Staff access arrives with the Phase 2 dashboard.
