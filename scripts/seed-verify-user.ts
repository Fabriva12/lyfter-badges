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

const VERIFY_EMAIL = "verify-fase3@lyfter.test";

async function main() {
  const user = await prisma.user.findUnique({ where: { email: VERIFY_EMAIL } });

  if (!user) {
    throw new Error(`Verification user ${VERIFY_EMAIL} not found; sign up first`);
  }

  const event = await prisma.event.findUnique({
    where: { slug: "demo-2026" },
    include: {
      badges: {
        include: { badge: true, qrTokens: true },
      },
    },
  });

  if (!event) {
    throw new Error("demo-2026 event not found; seed first");
  }

  await prisma.registration.upsert({
    where: { userId_eventId: { userId: user.id, eventId: event.id } },
    update: {},
    create: { userId: user.id, eventId: event.id },
  });

  const wanted = ["demo-keynote", "demo-rsc"];
  const tokens = await prisma.qrToken.findMany({
    where: { token: { in: wanted } },
  });

  for (const token of tokens) {
    if (!token.eventBadgeId) {
      continue;
    }

    await prisma.scan.upsert({
      where: { userId_qrTokenId: { userId: user.id, qrTokenId: token.id } },
      update: { eventBadgeId: token.eventBadgeId },
      create: {
        userId: user.id,
        qrTokenId: token.id,
        eventBadgeId: token.eventBadgeId,
        eventId: event.id,
        xpAwarded: 0,
      },
    });
  }

  // Set the real XP from the badge values.
  for (const token of tokens) {
    const eventBadge = event.badges.find((eb) =>
      eb.qrTokens.some((t) => t.id === token.id),
    );
    const xp = eventBadge?.badge.xpValue ?? 0;
    await prisma.scan.update({
      where: { userId_qrTokenId: { userId: user.id, qrTokenId: token.id } },
      data: { xpAwarded: xp },
    });
  }

  const xpAgg = await prisma.scan.aggregate({
    where: { userId: user.id },
    _sum: { xpAwarded: true },
  });

  console.log(
    `Granted ${tokens.length} scans to ${VERIFY_EMAIL}; total XP ${xpAgg._sum.xpAwarded ?? 0}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
