/*
  Warnings:

  - Added the required column `eventId` to the `QrToken` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QrKind" AS ENUM ('WELCOME', 'BADGE');

-- AlterTable
ALTER TABLE "QrToken" ADD COLUMN     "eventId" TEXT NOT NULL,
ADD COLUMN     "kind" "QrKind" NOT NULL DEFAULT 'BADGE',
ALTER COLUMN "eventBadgeId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "QrToken_eventId_idx" ON "QrToken"("eventId");

-- AddForeignKey
ALTER TABLE "QrToken" ADD CONSTRAINT "QrToken_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
