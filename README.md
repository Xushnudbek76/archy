# Archy API

[![Backend checks](https://github.com/Xushnudbek76/archy/actions/workflows/ci.yml/badge.svg)](https://github.com/Xushnudbek76/archy/actions/workflows/ci.yml)

Archy is a lecture workspace for organizing courses, recordings, transcripts and notes. This repository contains its independently runnable NestJS backend.

**Stage:** working API foundation. Configuration validation, a liveness endpoint, request tracing and safe HTTP errors are implemented. Courses, authentication and recording processing are planned.

**Frontend:** [archy-next](https://github.com/Xushnudbek76/archy-next).

## Technology

NestJS 11, TypeScript, Node.js 24, REST, Jest/Supertest, ESLint, Prettier and GitHub Actions. PostgreSQL/Prisma and Supabase Auth/Storage are selected for the next milestones; they are not integrated yet.

## Architecture

```text
Next.js frontend → HTTP /v1 → NestJS API
                               AppModule
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
    libs/
      config/              Validated application configuration
      filters/             Safe HTTP exception boundary
      dto/                 Reserved for feature DTOs
      enums/
      types/
  test/                    HTTP integration tests
  tsconfig.app.json
docs/                      Architecture decisions, roadmap and verification
compose.yml                Optional PostgreSQL for the next milestone
```

See [separate-project architecture](docs/decisions/0002-separated-projects.md) and [the rebuild roadmap](docs/superpowers/plans/2026-10-06-archy-rebuild-roadmap.md).

## Local development

Prerequisites: Node.js 24.14.1, npm 11.11.0 and Git.

```sh
git clone https://github.com/Xushnudbek76/archy.git
cd archy
npm ci
cp .env.example .env
npm run start:dev
```

No database or cloud credentials are required to run the current API. The liveness endpoint is `GET http://127.0.0.1:3007/v1/health/live` and returns `{"status":"ok"}`. Liveness does not claim database or provider readiness.

Clone and run [archy-next](https://github.com/Xushnudbek76/archy-next) separately to open the workspace at <http://localhost:3000>. Stop development processes with Ctrl+C.

## Configuration

| Variable            | Development default     | Purpose                                                   |
| ------------------- | ----------------------- | --------------------------------------------------------- |
| `NODE_ENV`          | `development`           | Application environment                                   |
| `API_HOST`          | `127.0.0.1`             | Bind address                                              |
| `API_PORT`          | `3007`                  | API port                                                  |
| `WEB_ORIGIN`        | `http://localhost:3000` | Allowed browser origin; required explicitly in production |
| `POSTGRES_PASSWORD` | No usable default       | Optional local PostgreSQL container only                  |

`dotenv` loads `.env` from this repository root. If the API address changes, update the frontend's `API_BASE_URL`. Keep credentials in ignored environment files.

The optional Compose configuration prepares PostgreSQL. Choose a local `POSTGRES_PASSWORD` in `.env` before running `docker compose up -d postgres`. Compose has not been verified on the development Mac because Docker is unavailable; database integration is future work.

## Verification

```sh
npm run check
npm audit --omit=dev
```

`check` runs formatting, lint, strict TypeScript, 14 configuration unit tests, 8 HTTP integration tests and a production build. Tests verify configuration failures, health behavior, CORS, generated request IDs, sanitized errors and parser status handling.

Individual commands: `npm test`, `npm run test:integration`, `npm run lint`, `npm run typecheck` and `npm run build`. CI runs the same checks on pushes and pull requests. See [verification evidence](docs/separated-projects-verification.md) for local results and limitations.

After building:

```sh
WEB_ORIGIN=http://localhost:3000 npm run start:prod
```

The entrypoint is `dist/apps/archy-api/main.js`. Successful compilation does not establish production readiness.

## Next milestones

1. PostgreSQL/Prisma migrations, authentication and owner-scoped courses.
2. Private audio ingestion and recording persistence.
3. Durable transcription and AI notes in a separate batch application.
4. Search, recording recovery, administration and deployment.

## Contributing

Use feature branches and pull requests. Keep changes focused, explain the behavior and verification, and run `npm run check` before submitting. Use `feat` for new behavior, `fix` for actual corrections, and `docs`, `test` or `chore` where appropriate.
