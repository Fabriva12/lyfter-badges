-- AlterTable
ALTER TABLE "EventBadge" ADD COLUMN     "partnerId" TEXT;

-- CreateIndex
CREATE INDEX "EventBadge_partnerId_idx" ON "EventBadge"("partnerId");

-- AddForeignKey
ALTER TABLE "EventBadge" ADD CONSTRAINT "EventBadge_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
