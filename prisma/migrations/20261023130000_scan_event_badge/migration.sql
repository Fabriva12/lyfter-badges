-- Run as one transaction: if the backfill leaves a NULL (unexpected legacy
-- row), the SET NOT NULL fails and the dedupe above must not survive.
BEGIN;

-- AlterTable
ALTER TABLE "Scan" ADD COLUMN     "eventBadgeId" TEXT;

-- Backfill: every Scan belongs to the badge of the QR token that produced it.
-- WELCOME tokens only create a Registration, so this must leave no NULLs.
UPDATE "Scan" s
SET "eventBadgeId" = q."eventBadgeId"
FROM "QrToken" q
WHERE s."qrTokenId" = q."id";

-- Deduplicate pre-existing rows. Before this migration the same attendee could
-- scan two different QR tokens of the same badge and earn it twice. Keep the
-- oldest scan and drop the rest so the unique index below can be created.
DELETE FROM "Scan" s
USING "Scan" keep
WHERE s."userId" = keep."userId"
  AND s."eventBadgeId" = keep."eventBadgeId"
  AND s."eventBadgeId" IS NOT NULL
  AND (
    keep."scannedAt" < s."scannedAt"
    OR (keep."scannedAt" = s."scannedAt" AND keep."id" < s."id")
  );

-- AlterTable
ALTER TABLE "Scan" ALTER COLUMN "eventBadgeId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Scan_eventBadgeId_idx" ON "Scan"("eventBadgeId");

-- CreateIndex
CREATE UNIQUE INDEX "Scan_userId_eventBadgeId_key" ON "Scan"("userId", "eventBadgeId");

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_eventBadgeId_fkey" FOREIGN KEY ("eventBadgeId") REFERENCES "EventBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
