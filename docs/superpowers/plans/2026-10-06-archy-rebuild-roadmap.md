# Archy Rebuild Roadmap

Status: separate API/frontend foundations published; PostgreSQL/Prisma foundation verified locally. Hosted development provisioning and identity/course workflows remain pending.

**Goal:** Rebuild Archy as a maintainable lecture assistant with complete user workflows, durable processing, and verified operations.

**Design:** [Design brief](../specs/2026-10-06-archy-design.md).
**Current skeleton plan:** [Separate backend/frontend projects](2026-10-07-archy-separated-projects.md). The older detailed workspace plan is historical; write the next domain plan using the independent roots below.

## Approach

Use `/Users/user/Desktop/archy` for the NestJS backend and `/Users/user/Desktop/archy-next` for the Next.js frontend, each with its own dependencies and tooling. Use the original Archy as a feature reference and Insu as a backend-organization reference. Build a complete narrow workflow before adding original Archy's advanced features. Each milestone ends with running software, recorded checks, and a small reviewable release.

This is a product MVP rebuild, not an immediate replacement of the original production Archy. User/data migration requires a separate plan if requested later.

## Target Structure

```text
archy/                      Independent NestJS backend
  apps/
    archy-api/
      src/
        components/         Feature modules, services, HTTP controllers
        libs/               Config, filters, DTOs, enums, types
        database/           Prisma integration (Milestone 1)
      test/
    archy-batch/            Durable worker process (Milestone 3)
  prisma/                   Schema/migrations (Milestone 1)
  docs/
  nest-cli.json
  package.json
  package-lock.json
  compose.yml
  .github/workflows/ci.yml

archy-next/                 Independent Next.js frontend
  app/                      Thin route entrypoints and layouts
  api/                      Server transport; generated client later
  libs/
    components/             Common, layout and feature UI
    hooks/
    enums/
    types/
  styles/
  public/
  tests/e2e/                Browser workflows (Milestone 1)
  package.json
  package-lock.json
  .github/workflows/ci.yml
```

Use independent npm projects and lockfiles, Node.js 24 LTS, strict TypeScript, Next.js, NestJS, PostgreSQL, Prisma, Supabase Auth/Storage, BullMQ/Redis, Tailwind, Jest/Supertest, Playwright, Docker, and GitHub Actions. Add libraries only when a milestone needs them.

## Milestone 1 — Foundation, Identity, and Courses

**Deliverable:** A runnable web/API application with real login, private course CRUD, a guest sample view, database migrations, OpenAPI, and CI.

- [x] Bootstrap the local web/API and validated environment configuration.
- [x] Align separate project roots and folder conventions with Insu/Nestar.
- [x] Define User and Course models and Prisma-owned `app` schema migrations.
- [ ] Verify Supabase JWTs in NestJS and read administrator role from the database.
- [ ] Implement owner-scoped course create/list/rename/archive APIs.
- [ ] Generate the frontend API client; build responsive login/course screens.
- [ ] Add a clearly labeled anonymous read-only sample view.
- [ ] Verify migration-from-empty, ownership isolation, session behavior, API contract, and responsive browser flows in CI.

**Complete when:** a new user can sign in and manage courses; another user cannot access them; sample mode cannot write; a clean checkout passes the documented checks. Write the next detailed Milestone 1 plan for the independent project roots.

## Milestone 2 — Private Audio Ingestion

**Deliverable:** A user uploads a short audio file into an owned course and sees an accepted recording record.

- [ ] Add Recording and Upload models and the state transitions `UPLOADING → ACCEPTED` or `FAILED`.
- [ ] Implement admission, scoped storage authorization, and upload acceptance endpoints.
- [ ] Validate actual media format, owner, checksum, size ≤20 MiB, duration ≤10 minutes, and object existence. Do not trust extension/MIME alone.
- [ ] Use immutable object keys and idempotent acceptance; repeated finalization returns the existing acceptance result.
- [ ] Build upload progress, cancel, invalid-media, and interrupted-upload recovery UI.
- [ ] Add private signed playback/download access and cleanup for abandoned objects.

**Tests:** foreign-owned object/path, oversized or invalid media, MIME/extension mismatch, missing object, duplicate accept, interrupted upload, and cancelled admission.

**Complete when:** a verified sample is accepted once and stays private; rejected samples cannot enqueue processing. Record which upload recovery behavior was actually tested.

## Milestone 3 — Transcription and AI Notes

**Deliverable:** Accepted recordings become transcripts and notes through an independently running worker.

- [ ] Add ProcessingRun, Transcript, Note, and OutboxEvent models with uniqueness/fencing constraints.
- [ ] Persist processing intent and its outbox event in one PostgreSQL transaction.
- [ ] Publish stable BullMQ jobs; build dispatcher and worker as separate process entry points in `apps/archy-batch`.
- [ ] Implement one transcription provider and one summary provider behind typed adapters; record provider/model/prompt version.
- [ ] Persist `QUEUED → TRANSCRIBING → SUMMARIZING → COMPLETED` progress, safe errors, and attempt metadata.
- [ ] Retry transient failures with bounded backoff; distinguish permanent failures and cancellation.
- [ ] Provide fixture adapters for automated tests and clearly labeled preprocessed demo results.

**Tests:** DB commit before queue publication, publication-before-dispatch-mark crash, duplicate delivery, provider timeout/429, malformed provider output, worker restart between stages, and successful completion persisted once.

**Complete when:** a real short sample completes with real credentials, fixture tests run without paid provider calls, and a worker restart does not duplicate saved outputs. No exactly-once external billing claim.

## Milestone 4 — Notes, Progress, and Search

**Deliverable:** A usable course/recording/note workflow on desktop and mobile browsers.

- [ ] Build recording list, progress panel, transcript viewer, summary viewer, copy/download, and failure/retry states.
- [ ] Stream persisted progress over authenticated SSE with reconnect and state refresh.
- [ ] Implement paginated owner-scoped search over course/title/transcript/note text using PostgreSQL search and appropriate indexes.
- [ ] Add note bookmarks with an owner/note uniqueness constraint.
- [ ] Deliver keyboard-accessible English/Korean core screens and useful empty states.
- [ ] Introduce Zustand only for shared recorder UI state that React state cannot conveniently own.

**Tests:** reconnect after missed events, stale event revision, cross-user search/bookmark attempts, search pagination, empty/error states, unsafe generated Markdown, and keyboard/mobile viewport flows.

**Complete when:** a user can find, read, bookmark, and export their notes without relying on an uninterrupted stream.

## Milestone 5 — Recording and Recovery

**Deliverable:** Microphone capture uses the same verified ingestion pipeline and survives supported interruption scenarios.

- [ ] Add microphone preflight, consent, start/pause/resume/stop controls, and duration/size limits.
- [ ] Persist captured chunks and upload metadata in IndexedDB before treating them as recoverable; use bounded local storage and quota error handling.
- [ ] Reuse the upload contract, deduplication, and processing pipeline instead of adding a second backend path.
- [ ] Fence stale workers after retry/deletion; immediately hide deleted resources and retry private-object cleanup.
- [ ] Reconcile PostgreSQL intents after Redis outage/data loss; document Redis persistence and job-retention configuration.
- [ ] Run real browser/device checks and state which background-capture behaviors are supported. Browser APIs cannot guarantee uninterrupted background recording on every device.

**Tests:** network loss, browser refresh after acknowledged local persistence, storage quota failure, duplicate chunks, worker termination, Redis outage/restart, deletion during processing, and obsolete worker completion.

**Complete when:** supported recovery paths produce a single accepted result; unsupported interruption paths explain the remaining recoverable data honestly. Test desktop Chrome and Safari plus one real mobile browser.

## Milestone 6 — Administration and Operations

**Deliverable:** An operator can diagnose and safely retry failures.

- [ ] Add database-backed ADMIN authorization and a documented restricted administrator-provisioning command.
- [ ] Implement a failed-run view showing sanitized errors, stage, attempt count, timestamps, and request/run IDs.
- [ ] Audit manual retry; increment processing version and prevent concurrent retry races.
- [ ] Add structured logs, Sentry, health/readiness checks, and graceful shutdown.
- [ ] Apply upload and AI-work quotas/rate limits to the demo deployment and authenticated endpoints.
- [ ] Configure bounded audio retention and repeated cleanup; document the actual policy shown to users.

**Tests:** forged administrator metadata, non-admin access, concurrent retries, expired signed file access, quota rejection, redaction, and repeated cleanup.

**Complete when:** a non-admin cannot operate the console; an administrator can trace and retry a fixture failure without exposing raw private content in logs.

## Milestone 7 — Deployment and Product Release

**Deliverable:** A public demo and evidence package suitable for applications.

- [ ] Containerize API/worker and media dependencies; configure web build separately.
- [ ] Set up isolated preview/demo environments and a documented release/rollback process.
- [ ] Enforce typecheck, lint, builds, migrations, API-client drift, integration tests, and Playwright in GitHub Actions.
- [ ] Verify TLS, session callbacks, CORS/origin controls, SSE reconnect, private storage, and real short-sample processing on the deployed environment.
- [ ] Measure search latency on a documented seeded dataset, processing latency for a documented audio sample, and recovery under one injected failure.
- [ ] Write README, ER diagram, architecture diagram, ADRs, operational runbooks, contribution/attribution notes, and a short product walkthrough.
- [ ] Release the product after explicit GitHub/deployment authorization; report only measurements actually collected.

**Complete when:** the demo is accessible, sample mode works without signup, release checks pass, and documented behavior has verification evidence.

## Optional Follow-Up Projects

| Feature                 | Prerequisite                                | Separate acceptance evidence                          |
| ----------------------- | ------------------------------------------- | ----------------------------------------------------- |
| Live transcript/summary | Reliable capture and provider pipeline      | Ordering, latency, reconnect, pause/resume            |
| Translation             | Stable notes and provider adapters          | Output language and terminology checks                |
| Timetable import/OCR    | Course model and private uploads            | Real screenshot → valid course schedule               |
| Shared classes          | Stable permissions and versioned processing | Membership isolation and simultaneous participants    |
| Notifications           | Outbox and auditability                     | Deduplicated delivery and preference handling         |
| Billing                 | Stable ownership and usage ledger           | Sandbox webhooks, retries, entitlement reconciliation |
| Community               | Explicit sharing/moderation design          | Public/private boundaries and moderation              |
| Native mobile           | Documented API and ingestion contracts      | Background lifecycle and device-specific recovery     |

Do not add all follow-ups before releasing the product MVP.

## Working Method

For each milestone, write a focused implementation plan, implement one reviewable task at a time, run its meaningful checks, record results, and commit small changes once the human authorizes GitHub work. Advance after the milestone's completion criteria pass. Implementation starts only when requested; this roadmap does not provision infrastructure or publish source.

## Scheduling

Use milestone completion rather than an invented deadline. Foundation and ingestion come first; processing and recovery need the most uncertainty allowance. After Milestone 1, measure actual weekly development capacity and estimate the remaining work. Publish an early preview after Milestone 4; finish recovery and operations before documenting reliability guarantees.
