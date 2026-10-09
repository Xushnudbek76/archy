# Archy separated projects implementation plan

> Execute this correction inline using superpowers:executing-plans. Preserve the existing behavior and tests. Commits and GitHub publishing remain deferred by the human.

**Goal:** Independently runnable Archy backend and frontend following the local Insu/Nestar folder conventions.

**Architecture:** NestJS lives in `Desktop/archy`; Next.js lives in `Desktop/archy-next`. They communicate over HTTP with independent dependencies and no cross-project imports.

**Tech stack:** Existing Node 24, strict TypeScript, NestJS, Next.js App Router, Tailwind, REST, Jest/Supertest and ESLint/Prettier.

**Spec:** [Separate-project design](../specs/2026-10-07-archy-separated-projects-design.md).

## Constraints and review focus

- Preserve the 22 existing API behavioral tests; no tests that merely assert folder names.
- Preserve the web's four routes and real API connection status.
- Test builds and development commands from each project root.
- Environment examples belong to the root where the corresponding framework loads them.
- Lockfiles, CI, TypeScript paths and Next's build root must not refer to the former workspace.
- Keep product integrations that are not implemented explicitly deferred.
- No commits or remote writes.

## Task 1 — Independent backend

- [x] Stop the previous development processes before relocating their files.
- [x] Move API sources/tests to `apps/archy-api`, move configuration/filters to `src/libs`, and register the health controller/service through `HealthModule` and `ComponentsModule`.
- [x] Move the API dependencies into the backend root manifest. Replace npm-workspace commands with independent NestJS scripts; configure root `nest-cli.json`, TypeScript, Jest, ESLint, environment example and backend CI.
- [x] Install backend dependencies; run the 22 existing tests, lint, typecheck and `nest build archy-api`. Confirm built entrypoint is `dist/apps/archy-api/main.js`.

## Task 2 — Independent frontend

- [x] Move the current web to `Desktop/archy-next`. Move routes to `app`, reusable UI to `libs/components`, styles to `styles`, and health transport to server-only `api/server.ts` with a public `HealthResponse` type.
- [x] Make the overview route delegate to the homepage component. Update imports and use root-relative TypeScript aliases.
- [x] Create independent frontend manifest/lockfile, tool configuration, CI, environment example, root documentation and identity instructions. Remove dependency on the old shared configuration package.
- [x] Install frontend dependencies; run formatting, lint, typecheck and production build from the frontend root.

## Task 3 — Integration and documentation

- [x] Update active architecture documents and the staged roadmap so later feature paths follow these roots. Preserve dated verification history with an explicit superseded-layout note.
- [x] Run both independent development commands. Verify API health, browser overview connection status and the Courses/Recordings/Settings routes, including a mobile breakpoint.
- [x] Obtain one fresh read-only review as required by the execution skill; fix material findings and run relevant verification.
- [x] Record actual results and the new startup commands. Leave everything local.
