# Archy API

[![Backend checks](https://github.com/Xushnudbek76/archy/actions/workflows/ci.yml/badge.svg)](https://github.com/Xushnudbek76/archy/actions/workflows/ci.yml)

Archy is a lecture workspace for organizing courses, recordings, transcripts and notes. This repository contains its independently runnable NestJS backend.

**Stage:** database foundation. The API has configuration validation, liveness/readiness endpoints, request tracing, safe errors and Prisma migrations for users and courses. Authentication, course HTTP endpoints and recording processing are planned. Hosted development provisioning is pending.

**Frontend:** [archy-next](https://github.com/Xushnudbek76/archy-next).

## Technology

NestJS 11, TypeScript, Node.js 24, REST, PostgreSQL, Prisma 7.10, Jest/Supertest, ESLint, Prettier and GitHub Actions. Supabase hosts the selected development PostgreSQL database; its Auth/Storage integrations are planned.

## Architecture

```text
Next.js frontend → HTTP /v1 → NestJS API
                               AppModule
                                 ├─ DatabaseModule → Prisma → PostgreSQL app schema
                                 └─ ComponentsModule
                                      └─ feature modules
                                           ├─ controllers: HTTP entrypoints
                                           └─ services: feature behavior
```

The frontend and backend have independent dependencies, lockfiles, environment configuration and CI. Domain rules belong in backend feature modules; the frontend communicates through public HTTP contracts.

```text
apps/archy-api/
  src/
    main.ts
    application.ts
    app.module.ts
    components/
      components.module.ts
      health/              Health controller, service and module
    database/              Prisma service and generated backend client
    libs/
      config/              Validated application configuration
      filters/             Safe HTTP exception boundary
      dto/                 Reserved for feature DTOs
      enums/
      types/
  test/                    HTTP and real PostgreSQL integration tests
  tsconfig.app.json
docs/                      Architecture decisions, roadmap and verification
prisma/                    Application schema and versioned SQL migrations
scripts/                   One-time database role/schema bootstrap
compose.yml                Optional local PostgreSQL
```

See [separate-project architecture](docs/decisions/0002-separated-projects.md) and [the rebuild roadmap](docs/superpowers/plans/2026-10-06-archy-rebuild-roadmap.md).

## Local development

Prerequisites: Node.js 24.14.1, npm 11.11.0 and Git.

```sh
git clone https://github.com/Xushnudbek76/archy.git
cd archy
npm ci
cp .env.example .env
# Configure DATABASE_URL using the database setup guide below.
npm run start:dev
```

A valid backend `DATABASE_URL` is required at startup. The liveness endpoint is `GET http://127.0.0.1:3007/v1/health/live` and returns `{"status":"ok"}` even if PostgreSQL is unavailable. `GET /v1/health/ready` returns 200 only when both application tables are queryable; otherwise it returns a sanitized 503. Use [the database setup guide](docs/database-setup.md) to provision and migrate a dedicated development database.

Clone and run [archy-next](https://github.com/Xushnudbek76/archy-next) separately to open the workspace at <http://localhost:3000>. Stop development processes with Ctrl+C.

## Configuration

| Variable            | Development default     | Purpose                                                   |
| ------------------- | ----------------------- | --------------------------------------------------------- |
| `NODE_ENV`          | `development`           | Application environment                                   |
| `API_HOST`          | `127.0.0.1`             | Bind address                                              |
| `API_PORT`          | `3007`                  | API port                                                  |
| `WEB_ORIGIN`        | `http://localhost:3000` | Allowed browser origin; required explicitly in production |
| `DATABASE_URL`      | Required                | Runtime role connection to the private app schema         |
| `DIRECT_URL`        | CLI only                | Migration role connection, stored in .env.migrations      |
| `POSTGRES_PASSWORD` | No usable default       | Optional local PostgreSQL container only                  |

`dotenv` loads `.env` from this repository root. If the API address changes, update the frontend's `API_BASE_URL`. Keep credentials in ignored environment files.

The selected hosted setup uses a dedicated Supabase development project. `.env.bootstrap` is for one-time administrator setup, `.env.migrations` for Prisma tooling and `.env` for runtime credentials. Never inject bootstrap or migration credentials into the API deployment. The optional Compose configuration provides a local PostgreSQL alternative; Docker is unavailable on the development Mac, so Compose execution remains unverified.

## Verification

```sh
npm run check
npm audit --omit=dev
```

`check` runs formatting, lint, strict TypeScript, configuration unit tests, HTTP integration tests and a production build without requiring a database. `npm run test:database` separately verifies a migrated, isolated local `archy_test` database using both `TEST_DATABASE_URL` and `TEST_MIGRATION_DATABASE_URL`. These tests cover Prisma persistence, constraints, runtime DDL denial, private migration history and readiness recovery. Never point database tests at development or production data.

Individual commands: `npm test`, `npm run test:integration`, `npm run lint`, `npm run typecheck` and `npm run build`. CI runs the same checks plus real database tests on a disposable PostgreSQL 17 service. See [database verification evidence](docs/database-verification.md) for current results and limitations.

After building:

```sh
WEB_ORIGIN=http://localhost:3000 npm run start:prod
```

The entrypoint is `dist/apps/archy-api/main.js`. Successful compilation does not establish production readiness.

## Next milestones

1. Connect the dedicated hosted development database, then authentication and owner-scoped courses.
2. Private audio ingestion and recording persistence.
3. Durable transcription and AI notes in a separate batch application.
4. Search, recording recovery, administration and deployment.

## Contributing

Use feature branches and pull requests. Keep changes focused, explain the behavior and verification, and run `npm run check` before submitting. Use `feat` for new behavior, `fix` for actual corrections, and `docs`, `test` or `chore` where appropriate.
