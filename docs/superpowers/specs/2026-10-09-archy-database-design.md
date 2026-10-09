# Archy database foundation

The next authorized milestone adds PostgreSQL persistence infrastructure to the separate NestJS backend. Hosted development uses a dedicated Supabase project selected by the human; existing projects are not changed. Frontend, login and course endpoints are outside this task.

## Boundaries

Prisma 7.10.0 owns migrations for the private `app` schema. Supabase Auth/Storage schemas remain managed by Supabase. NestJS uses a separate runtime database role with SELECT/INSERT/UPDATE/DELETE only; the migration role owns application tables. Neither application data nor runtime credentials are exposed to the browser or Supabase Data API. Hosted connections require verified TLS.

## Models

User: verified-auth subject UUID primary key (no generated default), nullable email/displayName, USER/ADMIN role default USER, createdAt. Course: generated UUID, owner UUID foreign key with restrictive deletion, title, nullable archivedAt, createdAt and updatedAt. Index ownerId/archivedAt/createdAt/id for ordered owned lists. SQL constrains title to a trimmed length of 1–100 and rejects leading/trailing whitespace.

## Connections and readiness

Runtime requires DATABASE_URL (PostgreSQL URI targeting app schema); tooling separately requires DIRECT_URL. DatabaseModule exports PrismaService with lifecycle cleanup. The API may serve liveness while PostgreSQL is unavailable. GET /v1/health/ready returns 200 only when the migrated User and Course tables are queryable; failure returns sanitized 503 without URLs/provider errors. Pool connection and query timeouts bound a failed probe.

## Verification

Test missing/malformed database configuration without credential leakage; isolated real PostgreSQL verifies migration-from-empty, owner FK, title constraints and runtime role denial of DDL. HTTP tests verify readiness success/failure and liveness independence. Existing tests/build remain green. CI provisions its own disposable PostgreSQL service; development data is not used for automated destructive setup.

## Workflow

Continue the approved next step on codex/database-foundation. Follow test-first behavioral checks, then an independent final review. Human organization selection and actual cost confirmation are required before cloud project creation. Setup is complete only after a real connection, migrations and readiness are verified.
