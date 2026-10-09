# Archy Milestone 1 — Historical Workspace Plan

This detailed plan predates the human's separate-project correction. Its workspace commands, package locations and file paths are superseded. Do not execute it as written. Product feature and security acceptance criteria remain reference material for the next milestone plan. The current structure is in [the separate-project plan](2026-10-07-archy-separated-projects.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use superpowers:subagent-driven-development only when the user explicitly selects delegation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a runnable Next.js/NestJS application with verified login, private course management, an anonymous read-only example, a generated API client, and mandatory automated checks.

**Architecture:** One npm-workspace repository contains web, API, database, client, and configuration packages. NestJS owns business rules and accesses a Prisma-managed PostgreSQL `app` schema. Supabase owns identity; web session handling forwards a verified user access token to NestJS.

**Tech Stack:** Node.js 24 LTS, strict TypeScript, Next.js App Router, React, Tailwind, NestJS, REST/OpenAPI, PostgreSQL, Prisma, Supabase Auth/SSR, Jest, Supertest, Playwright, Docker Compose, GitHub Actions.

**Spec:** [Design brief](../specs/2026-10-06-archy-design.md).

## Global Constraints

- Independent project root: `/Users/user/Desktop/archy`.
- Runtime: Node.js 24 LTS; TypeScript strict mode in all applications.
- Public API prefix: `/v1`; Next.js contains no duplicate domain write rules.
- Application schema: `app`; Prisma is its sole migration owner; Supabase Auth/Storage schemas are external.
- Roles: `USER` and `ADMIN`; application role comes from PostgreSQL, never user-editable auth metadata.
- Resource ownership: every private read and write checks the authenticated owner; foreign-owned resources return 404.
- Demo mode: anonymous, read-only, sample data labeled; it cannot enqueue AI work or write private data.
- MVP audio limit: 20 MiB and 10 minutes; accepted verified containers: WAV, MP3, MP4/M4A, WebM.
- Languages: English and Korean core UI; no requirement to translate the entire original Archy product.
- Production databases, credentials, and existing repository code are not changed during this rebuild.

Audio ingestion is outside Milestone 1; the audio limit is inherited for later tasks and is not claimed as implemented here.

## Review Focus

1. Invalid/expired/wrong-issuer JWTs must fail before private database reads — Task 3.
2. Foreign course IDs must never reveal existence or allow updates/archive — Task 4.
3. Whitespace-only or overlong titles and invalid pagination must return stable validation errors — Task 4.
4. Expired sessions and external-origin cookie-authenticated mutations must not perform writes — Task 5.
5. Anonymous demo mode must remain read-only even if a user sends write requests directly — Tasks 4 and 5.

## File and Command Contracts

Workspace names: `@archy/web`, `@archy/api`, `@archy/database`, `@archy/api-client`, `@archy/config`. Reserve `apps/worker` for Milestone 3; do not scaffold unused processing infrastructure yet.

Root scripts to create in Task 1:

| Command                                                     | Meaning                                                                 |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev:web`                                           | Start web on 3000                                                       |
| `npm run dev:api`                                           | Start API on 3007                                                       |
| `npm run typecheck`                                         | Typecheck all existing workspaces                                       |
| `npm run lint`                                              | Lint all existing workspaces                                            |
| `npm run build`                                             | Build database/client before API/web                                    |
| `npm run db:migrate`                                        | Apply application migrations to configured isolated development/test DB |
| `npm run db:generate`                                       | Generate Prisma client                                                  |
| `npm run api:export`                                        | Export OpenAPI without connecting to production resources               |
| `npm run client:generate`                                   | Generate checked-in public client from exported schema                  |
| `npm run client:check`                                      | Regenerate and fail if generated artifacts differ                       |
| `npm run test:integration --workspace @archy/api -- <file>` | Run isolated API/DB integration tests                                   |
| `npm run test:e2e`                                          | Run Playwright against isolated web/API services                        |

Ports: web 3000, API 3007, local PostgreSQL 5432. Health endpoints: `/v1/health/live` is liveness; `/v1/health/ready` checks database readiness after Task 2. Error response shape: `{ code: string, message: string, requestId: string }`; validation details may add `fields` but never tokens or stack traces.

## Current execution scope — 2026-10-07

The human authorized the initial local skeleton only. Archy is a real product; commits and GitHub publishing are deferred until requested after this skeleton. Task 1 runs without credentials for unimplemented services. Database/Auth environment requirements become mandatory in Tasks 2–3. No later task is claimed complete.

## Task 1 — Runnable Web/API and Environment Boundary

**Files:** Create root `package.json`, `package-lock.json`, `.nvmrc`, `.gitignore`, `.env.example`, `compose.yml`; `packages/config/tsconfig.base.json`; `apps/api/src/main.ts`, `app.module.ts`, `config/environment.ts`, `config/environment.spec.ts`, `health/health.controller.ts`; `apps/api/test/health.e2e-spec.ts`; `apps/web/src/app/layout.tsx`, `page.tsx`; workspace manifests and framework configuration; `docs/decisions/0001-stack.md`.

**Interfaces:** Produce `GET /v1/health/live → { status: "ok" }`; environment loader `loadEnvironment(env: NodeJS.ProcessEnv): Environment`. This initial stage validates `NODE_ENV`, `API_PORT`, `API_HOST`, and `WEB_ORIGIN` (explicit in production); web uses server-only `API_BASE_URL`. Database/Auth tasks later require `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWT_ISSUER`, `SUPABASE_JWT_AUDIENCE`, and `SUPABASE_JWKS_URL`. Migration tools alone require `DIRECT_URL`; migration credentials must not be required by or injected into production API/web processes. Test environment uses local test configuration.

- [x] Write `health.e2e-spec.ts`: assert `/v1/health/live` returns HTTP 200 and `{status:'ok'}`. Add `environment.spec.ts`: invalid config and missing production browser origin fail startup with variable names, never values.
- [x] Establish minimal workspace/test-runner configuration; run the tests and verify failures are missing behavior, not an unresolved test harness.
- [x] Implement root scripts, environment validation, global `/v1` prefix, request IDs, safe error filter, and a web page displaying API liveness.
- [x] Run `npm run test:integration --workspace @archy/api -- health.e2e-spec.ts`; `npm test --workspace @archy/api -- environment.spec.ts`; `npm run typecheck`; `npm run build`. Expected: health/config tests pass; web/API build; missing required config exits nonzero. Root workspace commands must tolerate database/client packages not existing until their tasks create them.
- [x] Record selected package versions, Node patch, and package manager in the ADR. Verification results are recorded in `docs/skeleton-verification.md`.
- [ ] Commit the skeleton once the human requests GitHub work; explicitly deferred for this stage.

## Task 2 — Application Database and Readiness

**Files:** Create `packages/database/prisma/schema.prisma`, `prisma.config.ts`, `prisma/migrations/<generated>/migration.sql`, `src/client.ts`, `src/index.ts`, `bootstrap/roles.sql`; `apps/api/src/database/database.module.ts`; `apps/api/test/database.e2e-spec.ts`; modify health controller/readiness service and root database scripts.

**Interfaces:** Export `PrismaService` with lifecycle connect/disconnect; models `User(id UUID PK, email nullable, displayName nullable, role USER default, createdAt)` and `Course(id UUID PK, ownerId UUID FK, title, archivedAt nullable, createdAt, updatedAt)`. Index course `(ownerId, archivedAt, createdAt)`; constrain trimmed title length 1..100 in SQL as well as API validation. Database connection does not grant schema modification to runtime role.

- [ ] Write database integration assertions: fresh migration creates both models; invalid owner FK and whitespace-only title inserts are rejected; runtime credentials cannot create/drop tables; readiness returns 503 when DB is unavailable.
- [ ] Run `npm run test:integration --workspace @archy/api -- database.e2e-spec.ts`; verify each assertion fails for the missing schema/readiness behavior.
- [ ] Implement schema, generated migration, restricted roles/bootstrap, Prisma service and readiness check. Do not modify managed Supabase schemas.
- [ ] Run `npm run db:migrate`; `npm run db:generate`; database integration tests. Expected: migrations succeed from empty database, constraints and role boundaries pass, readiness recovers when DB returns.
- [ ] Commit the database milestone changes.

## Task 3 — Verified Identity and Safe Profile Bootstrap

**Files:** Create `apps/api/src/auth/auth.module.ts`, `jwt-verifier.ts`, `auth.guard.ts`, `current-user.decorator.ts`, `principal.ts`; `apps/api/src/users/users.service.ts`, `users.controller.ts`; `apps/api/test/helpers/jwks-fixture.ts`, `auth.e2e-spec.ts`.

**Interfaces:** `VerifiedIdentity = {sub: string; email?: string}`; `verifyAccessToken(token: string): Promise<VerifiedIdentity>`; `CurrentPrincipal = {id: string; role: 'USER'|'ADMIN'}`; `UsersService.ensureProfile(identity: VerifiedIdentity): Promise<CurrentPrincipal>`; `GET /v1/me → {id, displayName, role}`. Guard verifies signature, configured issuer/audience, expiry, UUID subject, then resolves database role.

- [ ] Write auth integration assertions: no token→401; invalid signature/expired token/wrong issuer/wrong audience→401; valid signed fixture→200; repeated first requests create one user; `user_metadata.role='ADMIN'` still resolves USER; DB-assigned ADMIN resolves ADMIN.
- [ ] Start the isolated local JWKS fixture with ephemeral keys; run auth tests and verify meaningful failures before implementing verification.
- [ ] Implement verification and profile upsert, keeping tokens out of logs/error responses. Test fixtures exist only in test code, not a production auth-bypass flag.
- [ ] Run `npm run test:integration --workspace @archy/api -- auth.e2e-spec.ts`; expected all identity/role cases pass without calling real Supabase or using real user accounts.
- [ ] Commit identity changes.

## Task 4 — Owner-Scoped Course API and Public Sample

**Files:** Create `apps/api/src/courses/courses.module.ts`, `courses.controller.ts`, `courses.service.ts`, `courses.repository.ts`, `dto/create-course.dto.ts`, `dto/update-course.dto.ts`, `dto/list-courses.dto.ts`; `apps/api/src/demo/demo.controller.ts`, `demo.fixture.ts`; `apps/api/test/courses.e2e-spec.ts`, `demo.e2e-spec.ts`.

**Interfaces:** `CourseDto={id:string,title:string,createdAt:string,updatedAt:string}` with ISO timestamps; `PageInput={page:number,limit:number}`; `CoursePage={items:CourseDto[],total:number,page:number,limit:number}`. Export `CourseRow` as the Prisma Course model. Repository signatures: `create(ownerId:string,title:string):Promise<CourseRow>`; `findOwned(ownerId:string,id:string):Promise<CourseRow|null>`; `listOwned(ownerId:string,input:PageInput):Promise<{items:CourseRow[],total:number}>`; `renameOwned(ownerId:string,id:string,title:string):Promise<CourseRow|null>`; `archiveOwned(ownerId:string,id:string):Promise<boolean>` (true for an owned existing item, including already archived). Read/rename exclude archived rows. API: POST `/v1/courses`→201; GET collection→CoursePage; GET/PATCH item→200; DELETE item archives→204. List order is createdAt DESC, id DESC. Default page 1/limit 20; page≥1, limit 1..50; title trimmed length 1..100. Archived courses are excluded from normal lists; repeat owner archive→204. Anonymous GET `/v1/demo` returns a fixed labeled sample, never private DB rows.

- [ ] Write integration assertions: USER A can create/read/rename/archive; USER B gets 404 for A's item on GET/PATCH/DELETE; anonymous private requests→401; invalid title/page/limit→400; duplicate archive stays harmless; demo GET→200 with `mode:'sample'`; direct anonymous POST `/v1/courses` remains 401 after viewing demo.
- [ ] Run course/demo tests; verify failures correspond to missing ownership/validation behavior.
- [ ] Implement DTO validation, safe error codes, owner-scoped repositories, soft archive, pagination, and immutable sample response. Course IDs must never be sufficient authorization.
- [ ] Run course/demo integration tests plus `npm run typecheck`; expected all cases pass with real isolated PostgreSQL.
- [ ] Commit course/demo changes.

## Task 5 — Generated API Client and Web Workflow

**Files:** Create `apps/api/src/openapi/export.ts`; `packages/api-client/openapi.json`, `src/generated.ts`, `src/index.ts`; `apps/web/src/lib/auth/{server,client,session}.ts`, `src/lib/api/server.ts`, `src/lib/i18n/{en,ko}.ts`; web routes `src/app/login/page.tsx`, `signup/page.tsx`, `auth/callback/route.ts`, `courses/page.tsx`, `demo/page.tsx`; focused form/list components and web mutation/session bridge; `tests/helpers/auth-provider-fixture.ts`, `tests/e2e/courses.spec.ts`, `session.spec.ts`, `demo.spec.ts`.

**Interfaces:** Generated public types match Task 4; server API helper `apiForSession(): Promise<GeneratedApiClient>` forwards user identity to NestJS. Web mutation bridge rejects foreign Origin before forwarding authenticated writes; Nest remains the business-rule owner. Auth failures show login with a safe local return path; no open redirect. Sample route never offers private writes.

- [ ] Write browser assertions: session user creates/renames/archives a course and sees persisted list; session expiration leads to login with no mutation; external-origin mutation→403; `returnTo=https://external.example` is rejected; English/Korean form errors match locale; demo is accessible anonymously and visibly labeled sample.
- [ ] Implement OpenAPI export/client generation first; run `npm run api:export`; `npm run client:generate`; verify generated methods/types match course contracts.
- [ ] Create a test-only Supabase-compatible auth fixture server sharing the Task 3 ephemeral signing keys. Implement `/auth/v1/token` for password and refresh grants, `/auth/v1/user`, `/auth/v1/logout`, and `/auth/v1/.well-known/jwks.json`; seed two isolated users. Configure web/API URLs to this separate fixture process for browser tests. Production application code still uses ordinary Supabase clients and token verification, with no bypass flag.
- [ ] Implement official Supabase SSR session handling, session bridge, responsive forms, safe errors and locale copy. Do not persist a second token copy in localStorage.
- [ ] Run `npm run test:e2e` at desktop 1280×800 and mobile 390×844 against isolated services/auth fixtures. Also perform a separate real non-production Supabase signup/login/refresh/logout smoke check when credentials are supplied. Automated fixtures alone do not prove the hosted integration.
- [ ] Commit client/web changes and record any hosted-auth verification still pending.

## Task 6 — Mandatory Checks and First Preview Readiness

**Files:** Create `.github/workflows/ci.yml`, API/web Dockerfiles, `.dockerignore`, `README.md`, `docs/milestone-1-verification.md`; modify root scripts and Compose as necessary.

**Interfaces:** CI and documented local commands use the same workspace scripts. OpenAPI export works without production credentials; generated-client drift causes a failing check. Database bootstrap/migrations are explicit deployment steps, not something every API process races to run on startup.

- [ ] Configure CI with isolated PostgreSQL, Task 5 fixture Auth/JWKS server, and web/API services; require typecheck, lint, unit/integration tests, builds, migration-from-empty and client drift checks. Redis/AI infrastructure is not required for this milestone.
- [ ] Run the full sequence from a clean checkout: `npm ci`, local DB startup/bootstrap, `npm run db:migrate`, `npm run db:generate`, `npm run typecheck`, `npm run lint`, API unit/integration tests, `npm run api:export`, `npm run client:check`, `npm run build`, `npm run test:e2e`.
- [ ] Verify configured images run the built web/API, runtime DB role cannot migrate, and README identifies required non-production Auth configuration.
- [ ] Document commands, actual results, environment versions, screenshots, and pending hosted-auth checks. No successful deployment or production verification claim without execution evidence.
- [ ] Commit the readiness/docs changes. Provision/publish a preview only when requested and required host/account details are available.

## Milestone 1 Completion Gate

- [ ] Authenticated private course management works across web and API.
- [ ] Token verification, ownership isolation, malformed input, session/origin boundaries, and sample restrictions pass automated checks.
- [ ] Fresh database migration, restricted runtime DB role, generated API client, builds and browser flows pass.
- [ ] Real non-production Supabase auth smoke is recorded separately, or explicitly remains pending.
- [ ] README makes setup reproducible and explains who owns each layer.

After this gate, write the Milestone 2 private-ingestion implementation plan using the agreed recording/upload contracts. Do not implement queues, billing, OCR, shared classes, or mobile clients in this milestone.
