# 0001 — Archy's application foundation

Status: technology choices retained; the single-workspace layout is superseded by [0002](0002-separated-projects.md), 2026-10-07.

## Decision

Use an npm-workspace monorepo with a Next.js frontend and a modular NestJS REST backend. Separate presentation from domain ownership while keeping one repository and one package manager. A worker will become a separate process when durable recording processing is implemented; unused worker infrastructure is deferred.

| Component            | Selected version               |
| -------------------- | ------------------------------ |
| Node.js              | 24.14.1                        |
| npm                  | 11.11.0                        |
| TypeScript           | 5.9.3                          |
| Next.js / React      | 16.4.0 / 19.3.0                |
| NestJS               | 11.2.7                         |
| Tailwind CSS         | 4.3.3                          |
| Jest / ts-jest       | 30.5.2 / 29.4.14               |
| ESLint / Prettier    | 9.39.5 / 3.9.9                 |
| PostgreSQL container | 17, prepared for the next task |

Registry package metadata was checked during initialization. Exact direct dependencies and the npm lockfile pin the installed tree. NestJS 11 provides a familiar supported framework line; newer major versions can be evaluated independently. TypeScript stays at 5.9 because the selected testing/linting tools do not yet support TypeScript 7. ESLint stays on 9 because the current Next React lint plugin peer range excludes ESLint 10; review this compatibility pin when that plugin updates.

PostgreSQL with Prisma will own the application's relational schema. Supabase Auth and private Storage will supply identity and files. Redis/BullMQ will support durable background processing after recording ingestion exists. These integrations are architectural decisions, not implemented features in this skeleton.

## Boundaries

- Web renders pages and later transports the verified session to the API.
- API owns domain authorization, writes, validation, and resource lifecycle.
- Shared packages contain narrowly scoped configuration and, later, generated public API contracts. The browser must never import database or worker code.
- Runtime configuration validates services actually used in this stage. Database/Auth configuration becomes mandatory with their implementation, rather than forcing fake credentials to run the skeleton.
- Liveness and readiness are separate; the current liveness route makes no provider-health claim.

## Dependency advisories

The initial install reported a critical advisory in the development launcher. A scoped override selects patched `shell-quote` 1.12.0 for `concurrently`; launcher behavior must be smoke-tested after this override. No production dependency advisories were reported by `npm audit --omit=dev` during initialization.

Development-only advisories remain in the Next lint glob dependency (`braces`, with no patched release available) and Jest's legacy YAML/formatting dependency chain. Do not use `npm audit fix --force` to silently downgrade Next or Jest. Revisit when compatible upstream fixes are released. Runtime audit results do not imply the entire dependency tree is advisory-free.
