# 0003 — Private PostgreSQL and separate database roles

Status: implemented locally; hosted development provisioning pending, 2026-10-09.

Prisma 7.10 owns versioned migrations for the private `app` schema. It generates a CommonJS TypeScript client inside the backend; frontend source never imports it. Pin CLI, client and pg adapter together. Supabase Auth/Storage schemas remain provider-owned.

`archy_migrator` owns the app schema and tables. `archy_runtime` has schema/type usage and explicit SELECT/INSERT/UPDATE/DELETE on application tables, without DDL rights or migration-history access. Credentials live in separate ignored files, and the API loads runtime configuration only. Neither role is superuser, role creator, database creator or RLS bypasser.

Private-schema RLS policies permit the trusted backend role. They protect against accidental grants to other roles; they do **not** implement user ownership. Authenticated owner-scoped authorization will be enforced by NestJS in the identity/course milestone. No public course endpoints exist in this milestone. Do not expose app through the Supabase Data API.

User IDs are verified authentication subject UUIDs, without a generated default. Courses have generated UUIDs, an indexed owner relation with restrictive deletion, bounded trimmed titles and archive/timestamp fields. The database enforces foreign keys and title constraints; Prisma maintains updatedAt for ORM writes.

Liveness is independent of database availability. Readiness queries both migrated application tables using runtime credentials and returns a safe 503 for missing tables or unavailable connections. The pg adapter limits each API process to five connections and bounds connection/query/statement time to two seconds. Nest shutdown disconnects the client.

The stable Prisma line is deliberately preferred over the registry's Prisma 8 release candidate. Scoped overrides select patched deepmerge-ts and mysql2 dependencies in Prisma tooling; generation, validation and migration compatibility are verified. Runtime audit has no known advisories at the recorded verification point; this does not describe all development dependencies.
