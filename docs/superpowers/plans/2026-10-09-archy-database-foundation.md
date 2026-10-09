# Archy database foundation plan

Spec: [Database design](../specs/2026-10-09-archy-database-design.md). Backend only; preserve separate frontend and reference projects.

## Task 1 — Configuration and Prisma tooling

- [x] Add failing configuration tests for required PostgreSQL DATABASE_URL, app schema and sanitized errors; observe RED.
- [x] Pin Prisma/client/adapter 7.10.0 and pg; generate CommonJS client under API database/generated. Configure Prisma tooling to use DIRECT_URL without requiring migration credentials at runtime.
- [x] Implement database configuration validation; generate/build/check from a clean checkout without requiring a running database.

## Task 2 — Schema and credentials

- [x] Write real PostgreSQL integration tests for migrations, User/Course insertion, owner FK, title bounds and runtime DDL denial. Run RED against an isolated empty test database.
- [x] Generate migration for app.User and app.Course, add title constraint, private-schema grants and bootstrap tools for distinct migration/runtime roles. Never print generated credentials.
- [ ] Provision a disposable CI PostgreSQL service and run migrations/tests; document dedicated hosted development setup.

## Task 3 — Runtime and readiness

- [x] Add failing HTTP tests for readiness 200/503, safe errors and liveness while database is down.
- [x] Wire a singleton PrismaService and DatabaseModule with lifecycle cleanup and bounded connection/query timeouts. Probe both application tables for readiness.
- [ ] Run all tests, lint, typecheck and production build; perform a final read-only review and resolve material findings.

## Task 4 — Hosted handoff

- [ ] Use the human-selected Supabase organization/project; confirm actual project cost before creating it. Store development credentials only in ignored environment files.
- [ ] Apply Prisma migrations to the dedicated development project and verify actual readiness. Record limitations accurately.

Review focus: private schema access, runtime role DDL denial, migration credentials absent at runtime, missing tables fail readiness, credential-safe startup/errors, timeout and connection cleanup, isolated test data.
