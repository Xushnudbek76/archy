-- Bootstrap owns schema creation; migrations only need DDL inside app.
BEGIN;

-- CreateEnum
CREATE TYPE "app"."UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "app"."User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320),
    "displayName" VARCHAR(100),
    "role" "app"."UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Course" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "archivedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Course_ownerId_archivedAt_createdAt_id_idx" ON "app"."Course"("ownerId", "archivedAt", "createdAt" DESC, "id" DESC);

-- AddForeignKey
ALTER TABLE "app"."Course" ADD CONSTRAINT "Course_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "app"."User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Application tables stay private. NestJS is the trusted data-access boundary.
ALTER TABLE "app"."Course" ADD CONSTRAINT "Course_title_valid"
  CHECK (char_length("title") BETWEEN 1 AND 100 AND "title" !~ '^[[:space:]]|[[:space:]]$');

REVOKE ALL ON SCHEMA "app" FROM PUBLIC;
REVOKE ALL ON TYPE "app"."UserRole" FROM PUBLIC;
GRANT USAGE ON TYPE "app"."UserRole" TO archy_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON "app"."User", "app"."Course" TO archy_runtime;

-- Defense in depth if another role is accidentally granted table access.
-- User ownership is enforced by NestJS when authenticated features are added.
ALTER TABLE "app"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "app"."Course" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "backend_access" ON "app"."User" TO archy_runtime USING (true) WITH CHECK (true);
CREATE POLICY "backend_access" ON "app"."Course" TO archy_runtime USING (true) WITH CHECK (true);

COMMIT;
