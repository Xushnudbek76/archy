# Database setup

Archy uses PostgreSQL through Prisma. Hosted development is configured in the human-selected personal Supabase project in Tokyo. Its application roles and `app` schema were absent before setup; migrations and API readiness have now been verified. The original company Archy project is not a development database for this rebuild and was not changed.

## Dedicated Supabase development project

1. Select a personal project dedicated to development. Inspect it before provisioning: bootstrap requires unused application roles and an absent `app` schema. This setup reused the selected personal project without creating another cloud project. If creating a project instead, select its organization and confirm its actual cost first.
2. In the project's **Connect** panel, obtain a PostgreSQL connection. On an IPv4 Mac, use **Session pooler**, port **5432**. Direct connections work when IPv6 is available. Do not use the transaction pooler on port 6543 for migrations.
3. Copy `.env.bootstrap.example` to `.env.bootstrap`. Set the administrator connection as `BOOTSTRAP_DATABASE_URL`, with `schema=app&sslmode=verify-full`. Set two different random passwords of at least 24 characters. For example, generate each locally with `openssl rand -hex 24`. Keep these passwords out of chat, Git and command arguments.
4. Run `npm run db:bootstrap` once. It creates `archy_migrator`, `archy_runtime` and the private `app` schema in a transaction. It refuses an existing app schema or application roles, and never rotates existing passwords. Administrator access is only needed for this step.
5. Copy `.env.migrations.example` to `.env.migrations`. Set `DIRECT_URL` to the same database using the migration role and its password. Session pooler usernames are `archy_migrator.PROJECT_REF`; direct connection usernames are `archy_migrator`. URL-encode passwords. Despite its name, `DIRECT_URL` also supports the session pooler.
6. Run `npm run db:migrate`. Prisma applies the checked-in SQL migrations. Use `npm run db:validate` to validate the schema and `npm run db:generate` to regenerate the backend client.
7. In `.env`, set `DATABASE_URL` using `archy_runtime.PROJECT_REF` (pooler) or `archy_runtime` (direct), its separate password and the same schema/TLS parameters. The API must not receive administrator or migration credentials.
8. Start the API and verify `GET /v1/health/ready` returns 200. Keep `.env.bootstrap` out of runtime deployments; remove it from the development machine after saving administrator access in your password manager.

Hosted TLS must verify certificates. If your connection requires Supabase's downloaded CA certificate, supply its URL-encoded path using `sslrootcert` rather than disabling verification. Application tables stay outside the Data API's exposed schemas. Do not add `app` to exposed schemas or grant `anon`/`authenticated` application-table access.

Connection URL parameters are limited to `schema`, `sslmode` and `sslrootcert`, with no duplicates. User/host/database overrides and pool/timeout parameters are rejected; credentials and targets must be in the URL authority/path. API connection limits are owned by the backend configuration.

Sources: [Supabase connection methods](https://supabase.com/docs/guides/database/connecting-to-postgres), [Prisma with Supabase](https://supabase.com/docs/guides/database/prisma), [Prisma 7 configuration](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference).

## Optional local PostgreSQL

Docker is optional; the selected development setup is hosted. If using Compose, set `POSTGRES_PASSWORD` in `.env` and run `docker compose up -d postgres`. Use `postgresql://archy:PASSWORD@127.0.0.1:5432/archy?schema=app` as the bootstrap URL. Then follow the same bootstrap/migration/runtime steps using role usernames without project suffixes. TLS is optional only for loopback connections. Compose has not been executed on the development Mac.

## Database tests

CI creates an empty PostgreSQL 17 database named `archy_test`, bootstraps the two roles and applies Prisma migrations before running `npm run test:database`. The workflow's fixed passwords are disposable test fixtures and must never be reused elsewhere.

For local tests, prepare a separate database with that exact name and migration/runtime roles. Supply `TEST_DATABASE_URL` and `TEST_MIGRATION_DATABASE_URL` through your shell environment or an ignored env file, then run `npm run test:database`. Tests refuse non-loopback hosts and other database names. They temporarily rename the Course table to verify readiness and delete only profiles/courses created by their unique fixture ID. Do not run concurrent tests against the same database.

## Migration ownership

Prisma is the sole application migration owner. Keep handwritten constraints, grants and policies in its versioned SQL migrations. Bootstrap manages role/schema provisioning only; Supabase continues to manage its Auth and Storage schemas. New model migrations must include explicit runtime grants and matching private-schema policies. Runtime credentials cannot read Prisma migration history or perform DDL in `app`.
