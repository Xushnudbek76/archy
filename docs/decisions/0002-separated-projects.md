# 0002 — Independent backend and frontend

Status: accepted from the human's requested architecture correction, 2026-10-07. Supersedes 0001's single npm-workspace layout; its product technology and data-ownership decisions still apply.

## Reference and resulting structure

| Reference on Desktop                              | Convention                                                   | Archy equivalent                                             |
| ------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `insurance-ai`, `nestar`                          | Independent backend root                                     | `archy`                                                      |
| `apps/insu-api`, `apps/nestar-api`                | Nest API application                                         | `apps/archy-api`                                             |
| Backend `src/components`                          | Feature modules, services, entrypoints                       | `src/components/health`, followed by auth/courses/recordings |
| Backend `src/libs`                                | Configuration, DTOs, enums, types and infrastructure helpers | `src/libs/config`, `filters`, `dto`, `enums`, `types`        |
| `insu-web`, `nestar-next`                         | Independent frontend root                                    | `archy-next`                                                 |
| Frontend `libs/components`                        | Shared layout, common UI and feature screens                 | `libs/components/common`, `layout`, `homepage`               |
| Frontend `libs/hooks`, `libs/types`, `libs/enums` | Reusable frontend code                                       | Same categories, adding actual code when required            |
| Frontend `apollo`                                 | API transport separate from UI                               | `api/server.ts` for the selected REST API                    |
| Frontend `pages`                                  | Thin route entrypoints                                       | `app` for the selected Next.js App Router                    |

Each root owns its own `package.json`, `package-lock.json`, `node_modules`, TypeScript settings, environment files, checks and CI. The Nest backend may contain multiple backend applications as Nestar does; `monorepo: true` in Nest CLI refers only to that backend application layout. It does not combine the frontend or npm projects.

The API module graph is `AppModule → ComponentsModule → HealthModule → HealthController/HealthService`. Future business modules follow that pattern. Configuration and HTTP filters live under `libs`; database integration will live under the API's `database` folder with root Prisma migrations. The batch/worker process is introduced with durable processing rather than running an idle placeholder.

The frontend route renders a homepage component; server-only HTTP transport fetches the public health contract. Cross-project source imports and shared filesystem dependencies are excluded. Later generated public API types belong to the frontend's `api` directory and are generated from an exported schema.

## Retained technology choices

Next.js App Router, React, Tailwind, strict TypeScript, NestJS REST, PostgreSQL/Prisma and Supabase Auth/Storage remain the selected technologies. Insu/Nestar supplied folder and module conventions; their older versions, GraphQL/Apollo transport, MongoDB schemas and token-storage implementations are not requirements of this correction.

## Tradeoff

The projects can be installed, checked, deployed and versioned separately. Shared configuration must be kept consistent explicitly, and API compatibility will later be checked through generated contracts rather than a shared npm workspace.
