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

async function main() {
  const partner = await prisma.user.findUnique({
    where: { id: "demo-partner" },
    include: {
      accounts: { select: { providerId: true, accountId: true } },
      partnerBadges: {
        include: {
          badge: { select: { name: true } },
          event: { select: { name: true, slug: true } },
          qrTokens: { select: { token: true, active: true } },
        },
      },
    },
  });

  if (!partner) {
    throw new Error("demo-partner not found; run the seed first");
  }

  console.log(`partner: ${partner.email} role=${partner.role}`);
  console.log(
    `accounts: ${partner.accounts.map((a) => `${a.providerId}:${a.accountId}`).join(", ") || "none"}`,
  );

  for (const stand of partner.partnerBadges) {
    const scans = await prisma.scan.count({
      where: { qrToken: { eventBadgeId: stand.id } },
    });

    console.log(
      `stand: ${stand.badge.name} (${stand.event.name}) room=${stand.room ?? "-"} scans=${scans} tokens=${stand.qrTokens.map((t) => t.token).join(",") || "none"}`,
    );
  }

  const organizerAccount = await prisma.account.findFirst({
    where: { userId: "demo-organizer", providerId: "credential" },
    select: { id: true },
  });

  console.log(`organizer credential account: ${organizerAccount ? "ok" : "missing"}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
