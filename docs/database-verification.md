# Database foundation verification

2026-10-09, `/Users/user/Desktop/archy`, branch `codex/database-foundation`.

## Local evidence

- PostgreSQL integration tests first ran against an isolated empty `archy_test` database: 8 failed and 1 passed, with missing tables and readiness returning 503.
- Fresh role/schema bootstrap and Prisma migration-from-empty succeeded. Repeating bootstrap refused existing roles without replacing credentials.
- 15 real PostgreSQL tests passed: generated Prisma persistence and updates, USER default, owner foreign key/deletion restriction, title boundaries, runtime CREATE/DROP denial, migration-history isolation and missing-table readiness/recovery.
- 27 configuration tests passed. Configuration tests observed RED for missing/unsafe connections and privileged API usernames, followed by GREEN after validation.
- 9 HTTP integration tests passed, including sanitized database-unavailable 503 and independent liveness.
- Formatting, ESLint, strict TypeScript and production build passed. Prisma schema validation and client generation passed with the pinned Prisma 7.10 tooling and scoped patched dependency overrides.
- Compiled production API returned liveness/readiness 200 with runtime credentials only, then shut down successfully on SIGTERM. Administrator, migration and test-only variables were removed from its process environment.
- `npm audit --omit=dev` reported zero vulnerabilities. Development tooling advisories are outside that runtime audit result.

Local SQL verification used a disposable PostgreSQL 18.4 binary in ignored scratch, listening only on loopback port 55432. It is not a project dependency or the selected development database. CI uses a disposable PostgreSQL 17 service and no Supabase credentials.

## Remaining verification

The personal Supabase account has not yet appeared in the connector. No cloud project, roles or schemas were changed. Hosted development creation requires the human's organization selection and confirmation of the tool's actual cost. Hosted migration, certificate verification and readiness must be verified after that connection is available.

The updated PostgreSQL CI workflow has been configured; its execution result will be recorded after publishing the feature branch. Optional Docker Compose has not been executed on this Mac. Authentication, owner-scoped HTTP endpoints and frontend workflows are future milestones.
