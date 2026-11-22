import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// Pure functions copied by hand would defeat the point, so the script queries
// the same shapes the app does and asserts the invariants directly.

type LevelRow = { level: number; name: string; minXp: number };

function resolveLevel(xp: number, rows: LevelRow[]) {
  const sorted = [...rows].sort((a, b) => a.minXp - b.minXp);
  let current = sorted[0];
  for (const row of sorted) {
    if (xp >= row.minXp) current = row;
  }
  return current;
}

async function main() {
  const attendee = await prisma.user.findFirst({
    where: { role: "ATTENDEE" },
    include: {
      registrations: { include: { event: true } },
      scans: { include: { qrToken: true, event: true } },
    },
  });

  if (!attendee) {
    console.log("No attendee found. Run the seed first (SEED_DEMO_DATA=true).");
    return;
  }

  console.log(`Attendee: ${attendee.email} (${attendee.id})`);

  const levels = await prisma.level.findMany({ orderBy: { minXp: "asc" } });
  console.log(`Levels configured: ${levels.length}`);

  // Cut 1: global XP.
  const xpAgg = await prisma.scan.aggregate({
    where: { userId: attendee.id },
    _sum: { xpAwarded: true },
  });
  const totalXp = xpAgg._sum.xpAwarded ?? 0;
  const myLevel = resolveLevel(totalXp, levels);
  console.log(`Global XP: ${totalXp} -> Level ${myLevel.level} (${myLevel.name})`);

  // Cut 2: per-event collection.
  for (const registration of attendee.registrations) {
    const eventId = registration.event.id;

    const scans = await prisma.scan.findMany({
      where: { userId: attendee.id, eventId },
      select: { qrTokenId: true },
    });
    const scannedTokens = new Set(scans.map((s) => s.qrTokenId));

    const eventBadges = await prisma.eventBadge.findMany({
      where: { eventId },
      include: { badge: true, qrTokens: { select: { id: true } } },
    });

    const collected = eventBadges.filter((eb) =>
      eb.qrTokens.some((t) => scannedTokens.has(t.id)),
    ).length;

    const eventXpAgg = await prisma.scan.aggregate({
      where: { userId: attendee.id, eventId },
      _sum: { xpAwarded: true },
    });
    const eventXp = eventXpAgg._sum.xpAwarded ?? 0;

    const prize = await prisma.prize.findUnique({ where: { eventId } });

    console.log(`\n  Event: ${registration.event.name}`);
    console.log(
      `    collection: ${collected} / ${eventBadges.length} badges (${scannedTokens.size} distinct tokens scanned)`,
    );
    console.log(`    event XP:  ${eventXp}`);
    if (prize) {
      const unlocked = collected >= prize.requiredBadgesCount;
      console.log(
        `    prize "${prize.name}": requires ${prize.requiredBadgesCount} -> ${
          unlocked ? "UNLOCKED" : "locked"
        }`,
      );
    }

    // Invariant: collection count must never exceed the token count.
    if (collected > scannedTokens.size) {
      throw new Error(
        `collection (${collected}) > distinct tokens (${scannedTokens.size}) for ${registration.event.name}`,
      );
    }
  }

  // Invariant: sum of per-event XP must be <= global XP.
  const perEventXp = await Promise.all(
    attendee.registrations.map(async (r) => {
      const agg = await prisma.scan.aggregate({
        where: { userId: attendee.id, eventId: r.event.id },
        _sum: { xpAwarded: true },
      });
      return agg._sum.xpAwarded ?? 0;
    }),
  );
  const summed = perEventXp.reduce((a, b) => a + b, 0);
  if (summed > totalXp) {
    throw new Error(`per-event XP sum (${summed}) > global XP (${totalXp})`);
  }
  console.log(`\nInvariant OK: per-event XP sum ${summed} <= global XP ${totalXp}`);
  console.log("Verification complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
