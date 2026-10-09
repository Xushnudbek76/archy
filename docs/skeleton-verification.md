# Archy skeleton verification — original layout

Historical evidence before the human requested separate projects. Workspace paths and commands below are superseded by `separated-projects-verification.md` and the current READMEs.

Verified locally on 2026-10-07 using Node.js 24.14.1 and npm 11.11.0.

## Automated checks

| Check                                   | Observed result                                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                | Fresh dependency installation completed successfully                                                                                                                 |
| `npm run check`                         | Passed formatting, lint, typecheck, tests, and both builds                                                                                                           |
| API unit tests                          | 14 passed: local defaults, configured port/host, malformed ports, runtime modes, production origin requirement, origin validation and sanitized configuration errors |
| API HTTP integration tests              | 8 passed: liveness, generated request IDs, 404 envelope, CORS, unexpected errors, authorization errors, oversized JSON, and unsupported charsets                     |
| `npm audit --omit=dev`                  | Zero production dependency advisories reported                                                                                                                       |
| Startup with `API_PORT=not-a-port`      | Exited 1; reported only `Invalid configuration: API_PORT`                                                                                                            |
| Production startup without `WEB_ORIGIN` | Exited 1; reported only `Invalid configuration: WEB_ORIGIN`                                                                                                          |

Health and configuration tests were observed failing for missing behavior before implementation. The parser-error regressions were reproduced with failing 413/415 tests before correction. A read-only review also identified unnamed tablet navigation; explicit link labels now preserve accessible names when visual text is hidden.

## Running application

- `npm run dev` started Next.js and NestJS together; Ctrl+C stopped both. The patched launcher dependency was exercised by this command.
- The built web and API started through their workspace `start` scripts. The production API used explicit `NODE_ENV=production` and `WEB_ORIGIN=http://localhost:3000`.
- `GET http://127.0.0.1:3007/v1/health/live` returned HTTP 200 with `{"status":"ok"}`.
- With the API stopped, the built overview displayed **Service unavailable**. After starting the built API, a fresh page load displayed **Service connected**.
- Browser navigation reached Courses, Recordings, and Settings with their expected titles and honest upcoming-feature placeholders.
- Desktop 1280×800 and mobile 390×844 layouts were inspected in the browser. The DOM content width equaled the viewport width at both sizes, with no horizontal overflow. Tablet 768×800 navigation retained accessible labels after correction.

## Scope and limitations

- No Git repository, commit, remote, push, or hosted deployment was created.
- GitHub Actions is prepared but has not run on GitHub.
- Docker is unavailable on this Mac; PostgreSQL Compose configuration is prepared and has not been executed.
- Database readiness, migrations, authentication, persistence, storage, and AI processing remain future tasks. These checks do not establish full product or production readiness.
- Full dependency audit reports 25 development-tool advisories (20 moderate, 5 high); the critical launcher advisory was patched. See the [stack decision](decisions/0001-stack.md) for the remaining upstream compatibility limitations.
