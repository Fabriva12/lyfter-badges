-- Give QR tokens a validity window: optional start and expiration.
ALTER TABLE "QrToken" ADD COLUMN "startsAt" TIMESTAMP(3);
ALTER TABLE "QrToken" ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE INDEX "QrToken_startsAt_idx" ON "QrToken"("startsAt");
CREATE INDEX "QrToken_expiresAt_idx" ON "QrToken"("expiresAt");
