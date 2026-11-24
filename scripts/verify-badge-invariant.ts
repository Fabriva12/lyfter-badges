import "dotenv/config";

import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/**
 * Proves the invariant that protects the badge economy: a second QR token for
 * the same event badge must NOT award that badge twice to the same attendee.
 *
 * It creates a temporary token, tries to collect the same badge through it, and
 * deletes the token afterwards. Safe to run against the demo database.
 */
async function main() {
  const scan = await prisma.scan.findFirst({
    select: {
      userId: true,
      eventId: true,
      eventBadgeId: true,
    },
  });

  if (!scan) {
    throw new Error("No scans found; seed the demo data first.");
  }

  const extraToken = await prisma.qrToken.create({
    data: {
      token: `verify-invariant-${randomUUID()}`,
      kind: "BADGE",
      eventId: scan.eventId,
      eventBadgeId: scan.eventBadgeId,
    },
    select: { id: true },
  });

  try {
    try {
      await prisma.scan.create({
        data: {
          userId: scan.userId,
          qrTokenId: extraToken.id,
          eventBadgeId: scan.eventBadgeId,
          eventId: scan.eventId,
          xpAwarded: 0,
        },
      });

      throw new Error(
        "FAIL: a second QR for the same badge created a second scan",
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        console.log(
          "OK: unique(userId, eventBadgeId) rejected the duplicate scan.",
        );
        return;
      }

      throw error;
    }
  } finally {
    // Cascades any scan that the failing branch could have created.
    await prisma.qrToken.delete({ where: { id: extraToken.id } });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
