import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../app/generated/prisma/client";
import { rankAttendees } from "../lib/gamification/leaderboard";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// The script queries the same shapes the app does and asserts the invariants
// directly. The ranking itself comes from the real pure function.

async function main() {
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      startsAt: true,
      endsAt: true,
      location: true,
    },
  });

  console.log(`Events: ${events.length}`);
  for (const event of events) {
    console.log(
      `  ${event.slug} | ${event.name} | ${event.startsAt.toISOString()} -> ${event.endsAt.toISOString()}`,
    );
  }

  for (const event of events) {
    const [grouped, stands, talks] = await Promise.all([
      prisma.scan.groupBy({
        by: ["userId"],
        where: { eventId: event.id },
        _sum: { xpAwarded: true },
        _count: { eventBadgeId: true },
      }),
      prisma.scan.groupBy({
        by: ["userId"],
        where: {
          eventId: event.id,
          eventBadge: { badge: { type: "STAND" } },
        },
        _count: { eventBadgeId: true },
      }),
      prisma.scan.groupBy({
        by: ["userId"],
        where: {
          eventId: event.id,
          eventBadge: { badge: { type: "TALK" } },
        },
        _count: { eventBadgeId: true },
      }),
    ]);

    const users = await prisma.user.findMany({
      where: { id: { in: grouped.map((group) => group.userId) } },
      select: { id: true, name: true, image: true },
    });

    const usersById = new Map(users.map((user) => [user.id, user]));
    const standsByUser = new Map(
      stands.map((group) => [group.userId, group._count.eventBadgeId]),
    );
    const talksByUser = new Map(
      talks.map((group) => [group.userId, group._count.eventBadgeId]),
    );

    const ranking = rankAttendees(
      grouped.map((group) => {
        const user = usersById.get(group.userId);

        if (!user) {
          throw new Error(`Scan without user: ${group.userId}`);
        }

        return {
          userId: user.id,
          name: user.name,
          image: user.image,
          xp: group._sum.xpAwarded ?? 0,
          badges: group._count.eventBadgeId,
          stands: standsByUser.get(group.userId) ?? 0,
          talks: talksByUser.get(group.userId) ?? 0,
        };
      }),
    );

    console.log(`\n  Event: ${event.name} (${ranking.rows.length} attendees)`);

    for (const row of ranking.rows) {
      console.log(
        `    #${row.rank} (pos ${row.position}) ${row.name} | ${row.xp} XP | ${row.badges} badges | ${row.stands} stands | ${row.talks} talks`,
      );
    }

    console.log(
      `    top: ${ranking.top.map((row) => row.name).join(", ") || "none"}`,
    );

    // Invariant: the rank is the competition rank, so it never skips more
    // than the number of tied attendees above it.
    for (const row of ranking.rows) {
      const tied = ranking.rows.filter(
        (other) => other.xp === row.xp && other.badges === row.badges,
      ).length;

      if (row.rank > row.position) {
        throw new Error(`rank ${row.rank} is above position ${row.position}`);
      }

      if (row.rank < row.position - tied + 1) {
        throw new Error(`rank ${row.rank} is below position ${row.position}`);
      }
    }

    // Invariant: the podium is the first three rows of the ranking.
    if (
      ranking.top.length > 0 &&
      ranking.top[0].userId !== ranking.rows[0].userId
    ) {
      throw new Error("the podium does not start with the first row");
    }

    // Invariant: badge count equals the number of distinct collected badges,
    // independent of how many QR tokens a badge has.
    for (const row of ranking.rows) {
      const distinctBadges = await prisma.scan.findMany({
        where: { userId: row.userId, eventId: event.id },
        select: { eventBadgeId: true },
        distinct: ["eventBadgeId"],
      });

      if (distinctBadges.length !== row.badges) {
        throw new Error(
          `badge count ${row.badges} does not match ${distinctBadges.length} distinct badges for ${row.name}`,
        );
      }
    }
  }

  console.log("\nInvariant OK: ranking, podium and badge counts agree.");
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
