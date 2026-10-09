# Archy — Separate backend and frontend

The human requested that the architecture and folders follow the Desktop Insu and Nestar projects, with separate backend and frontend projects. This updates the already authorized local skeleton. Product name, behavior, selected technologies, and the instruction to defer commits/GitHub remain in effect.

## Reference patterns

- `insurance-ai` and `nestar`: independent NestJS project roots, API applications under `apps/<product>-api`, feature modules under `src/components`, and support code under `src/libs`. Batch applications are separate backend processes.
- `insu-web` and `nestar-next`: independent Next.js project roots, routes separated from reusable code under `libs/components`, `libs/hooks`, `libs/types`, and `libs/enums`; assets live under `public`.

## Decision

Use `/Users/user/Desktop/archy` for the NestJS backend and `/Users/user/Desktop/archy-next` for the Next.js frontend. Each has its own manifest, lockfile, dependencies, TypeScript configuration, development command, build, linting, and CI workflow. Neither project depends on the other through a filesystem import or npm workspace.

Backend shape: `apps/archy-api/src/components/health/{health.module,health.controller,health.service}.ts`, `components/components.module.ts`, `libs/config`, `libs/filters`, and `libs/{dto,enums,types}`. `AppModule` imports `ComponentsModule`, which imports `HealthModule`. Add business feature modules and database integration as those features become real. Reserve `apps/archy-batch` for processing work; no idle batch process is introduced now.

Frontend shape: `app` contains thin App Router routes and layouts; `libs/components/{common,layout,homepage}` contains UI; `api/server.ts` contains server-only HTTP transport; `libs/types` contains public transport types. Hooks and enums have reserved directories. `styles/globals.css` and `public` own styling and static assets.

Retain the selected App Router, Tailwind, and REST API. Matching the project conventions does not require changing the transport to GraphQL, the router to Pages Router, or the planned PostgreSQL/Prisma persistence to MongoDB. These choices remain open to an explicit later product decision.

## Contracts and acceptance

- Backend: development port 3007, `/v1/health/live` returns `{status:'ok'}`, validated environment and safe error envelopes retain their current behavior.
- Frontend: development port 3000, existing routes and responsive presentation remain intact; health fetch uses server-only `API_BASE_URL`.
- Run each project from its own root with `npm ci`, `npm run dev`, and `npm run check`. Backend also supports the familiar `npm run start:dev` convention.
- Existing 22 API tests must still pass. Both projects must typecheck, lint, and build independently. Verify HTTP communication and routes after relocation.
- Update active design/roadmap/setup documentation and record the old single-workspace setup as superseded.
- No source from the reference projects is modified or copied into the rebuild. No Git initialization, commits, or remote writes.
