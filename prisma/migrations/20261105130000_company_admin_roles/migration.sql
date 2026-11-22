-- Three platform profiles: ATTENDEE, ADMIN and SUPER_ADMIN.
-- A company has many administrators and many events; an admin can belong to
-- several companies. Stand partners keep access through EventBadge.partnerId.

-- CreateEnum
CREATE TYPE "Role_new" AS ENUM ('ATTENDEE', 'ADMIN', 'SUPER_ADMIN');

-- AlterTable: user.role
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user"
    ALTER COLUMN "role" TYPE "Role_new"
    USING (
        CASE
            WHEN "role"::text IN ('ORGANIZER', 'PARTNER') THEN 'ADMIN'
            ELSE "role"::text
        END
    )::"Role_new";
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'ATTENDEE';

-- AlterTable: AuditLog.actorRole
ALTER TABLE "AuditLog"
    ALTER COLUMN "actorRole" TYPE "Role_new"
    USING (
        CASE
            WHEN "actorRole" IS NULL THEN NULL
            WHEN "actorRole"::text IN ('ORGANIZER', 'PARTNER') THEN 'ADMIN'
            ELSE "actorRole"::text
        END
    )::"Role_new";

-- DropEnum / RenameEnum
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMember" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "companyId" TEXT;

-- AlterTable
ALTER TABLE "AuditLog"
    ADD COLUMN "companyId" TEXT,
    ADD COLUMN "companyName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMember_companyId_userId_key" ON "CompanyMember"("companyId", "userId");

-- CreateIndex
CREATE INDEX "CompanyMember_userId_idx" ON "CompanyMember"("userId");

-- CreateIndex
CREATE INDEX "Event_companyId_idx" ON "Event"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: preserve the current isolation by creating one company per
-- existing organizer and making that organizer its administrator.
INSERT INTO "Company" ("id", "name", "slug", "createdAt", "updatedAt")
SELECT
    'cmp_' || substr(md5(u."id"), 1, 20),
    u."name" || ' Company',
    COALESCE(
        NULLIF(trim(both '-' from lower(regexp_replace(u."name", '[^a-zA-Z0-9]+', '-', 'g'))), '')
        || '-',
        ''
    ) || substr(md5(u."id"), 1, 6),
    now(),
    now()
FROM "user" u
WHERE u."role" = 'ADMIN'
  AND EXISTS (SELECT 1 FROM "Event" e WHERE e."organizerId" = u."id")
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CompanyMember" ("id", "companyId", "userId", "createdAt")
SELECT
    'cm_' || substr(md5(u."id"), 1, 20),
    'cmp_' || substr(md5(u."id"), 1, 20),
    u."id",
    now()
FROM "user" u
WHERE u."role" = 'ADMIN'
  AND EXISTS (SELECT 1 FROM "Event" e WHERE e."organizerId" = u."id")
ON CONFLICT ("companyId", "userId") DO NOTHING;

UPDATE "Event" e
SET "companyId" = cm."companyId"
FROM "CompanyMember" cm
WHERE e."organizerId" = cm."userId";

UPDATE "AuditLog" a
SET
    "companyId" = e."companyId",
    "companyName" = c."name"
FROM "Event" e
JOIN "Company" c ON c."id" = e."companyId"
WHERE a."eventId" = e."id";
