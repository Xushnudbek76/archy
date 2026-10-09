# Separate-project verification

Verified on 2026-10-07. This report covers the requested separation into the NestJS backend `/Users/user/Desktop/archy` and Next.js frontend `/Users/user/Desktop/archy-next`, following the Desktop Insu/Nestar conventions. It supersedes the original workspace report's setup paths.

## Completed checks

- Both roots passed a fresh `npm ci` using their own lockfiles. Neither manifest declares npm workspaces; neither lockfile contains former workspace entries or linked/local cross-project dependencies.
- Backend `npm run check` passed: Prettier, ESLint, strict TypeScript, 14 configuration tests, 8 HTTP integration tests, and `nest build archy-api`. The built entrypoint exists at `dist/apps/archy-api/main.js`.
- Frontend `npm run check` passed: Prettier, ESLint, Next.js route type generation, strict TypeScript and the production build for all four routes.
- `npm audit --omit=dev` reported zero vulnerabilities in each root. Development dependency advisories remain: 20 moderate in backend test tooling and 5 high in frontend lint tooling. These are not claims of a full security audit.
- Backend `npm run start:dev` started independently with zero compilation errors. `GET http://127.0.0.1:3007/v1/health/live` returned HTTP 200, `{"status":"ok"}`, a generated request ID and the configured browser origin.
- Frontend `npm run dev` started independently at `http://localhost:3000`. Browser verification confirmed the overview's real “Service connected” status and navigation to Courses, Recordings and Settings with their expected headings.
- At a 390 × 844 viewport, the overview and navigation rendered correctly; document width and viewport width were both 390 pixels. The temporary viewport override was reset.
- A fresh read-only architecture review found no critical or important findings. Its minor stale worker path in the roadmap was corrected to `apps/archy-batch`.

## Run locally

Backend, from `/Users/user/Desktop/archy`: `npm run start:dev`.

Frontend, from `/Users/user/Desktop/archy-next`: `npm run dev`.

The projects communicate over HTTP; there are no cross-project source imports. Both development processes were left running for the local preview after verification. Stop them with Ctrl+C in their respective terminals.

## Scope and limitations

No project Git initialization, commits, remote writes or deployments were performed. Original Archy, Insu and Nestar projects were preserved. Prepared GitHub Actions workflows have not run on GitHub.

Database migrations/readiness, authentication/authorization, persistence, uploads, recordings, AI processing and the batch application remain future features. The chosen PostgreSQL/Prisma and Supabase integrations are documented but not implemented. Docker Compose execution remains unverified because Docker is unavailable. This verification establishes the runnable skeleton and separation, not production readiness.
