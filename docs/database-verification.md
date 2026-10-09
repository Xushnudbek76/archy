# Database foundation verification

2026-10-09, `/Users/user/Desktop/archy`, branch `codex/database-foundation`.

## Local evidence

- PostgreSQL integration tests first ran against an isolated empty `archy_test` database: 8 failed and 1 passed, with missing tables and readiness returning 503.
- Fresh role/schema bootstrap and Prisma migration-from-empty succeeded. Repeating bootstrap refused existing roles without replacing credentials.
- 15 real PostgreSQL tests passed: generated Prisma persistence and updates, USER default, owner foreign key/deletion restriction, title boundaries, runtime CREATE/DROP denial, migration-history isolation and missing-table readiness/recovery.
- 37 unit tests passed, including configuration and database-test isolation. Configuration tests observed RED for missing/unsafe connections and privileged API usernames, followed by GREEN after validation.
- 9 HTTP integration tests passed, including sanitized database-unavailable 503 and independent liveness.
- Formatting, ESLint, strict TypeScript and production build passed. Prisma schema validation and client generation passed with the pinned Prisma 7.10 tooling and scoped patched dependency overrides.
- Compiled production API returned liveness/readiness 200 with runtime credentials only, then shut down successfully on SIGTERM. Administrator, migration and test-only variables were removed from its process environment.
- `npm audit --omit=dev` reported zero vulnerabilities. Development tooling advisories are outside that runtime audit result.

Local SQL verification used a disposable PostgreSQL 18.4 binary in ignored scratch, listening only on loopback port 55432. It is not a project dependency or the selected development database. CI uses a disposable PostgreSQL 17 service and no Supabase credentials.

## Hosted development evidence

The human selected an existing personal Supabase project in Tokyo. A read-only inspection confirmed no application schema, application roles or public tables before setup. The company project was not changed, and no additional project was created. Direct IPv6 access was unavailable from this Mac; the session pooler on port 5432 connected with `sslmode=verify-full` and the dashboard-downloaded Supabase CA certificate.

Role/schema bootstrap and the checked-in Prisma migration succeeded. User and Course tables are owned by `archy_migrator`, with RLS enabled. A verified runtime connection confirmed DML access to both tables, no CREATE permission in `app`, no migration-history SELECT permission, and no superuser, role-creation, database-creation or RLS-bypass privileges. Supabase `anon` and `authenticated` roles have no schema access.

The compiled production API returned 200 with `{"status":"ok"}` from both `/v1/health/ready` and `/v1/health/live`, using only runtime credentials. The smoke process was stopped afterward. Credentials and the downloaded certificate remain in ignored local configuration; the temporary raw password file was removed after successful authentication. Automated database tests were not run against the hosted development database.

## CI and remaining milestones

The database fix commit passed both push and pull-request PostgreSQL 17 CI: [push run](https://github.com/Xushnudbek76/archy/actions/runs/37867750485), [PR run](https://github.com/Xushnudbek76/archy/actions/runs/37867755497). Final review found driver-query overrides that bypassed connection validation; seven regression tests observed RED, then GREEN after restricting connection parameters. Optional Docker Compose has not been executed on this Mac. Authentication, owner-scoped HTTP endpoints and frontend workflows are future milestones.
