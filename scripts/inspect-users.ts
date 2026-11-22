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
  const users = await prisma.user.findMany({
    where: { email: { contains: "lyfter.test" } },
    include: {
      registrations: { select: { eventId: true } },
      scans: { select: { id: true, xpAwarded: true } },
      accounts: { select: { providerId: true, accountId: true } },
    },
  });

  console.log(`Users matching lyfter.test: ${users.length}`);
  for (const user of users) {
    console.log(
      `\n  id=${user.id}\n  email=${user.email}\n  role=${user.role}\n  registrations=${user.registrations.length}\n  scans=${user.scans.length} xp=${user.scans.reduce((a, s) => a + s.xpAwarded, 0)}\n  accounts=${user.accounts.map((a) => a.providerId).join(",") || "none"}`,
    );
  }

  const sessions = await prisma.session.findMany({
    include: { user: { select: { email: true, id: true } } },
  });
  console.log(`\nSessions: ${sessions.length}`);
  for (const session of sessions) {
    console.log(
      `  userId=${session.user.id} email=${session.user.email} expires=${session.expiresAt.toISOString()} token=${session.token.slice(0, 10)}...`,
    );
  }

  const demo = await prisma.user.findUnique({
    where: { email: "attendee@lyfter.demo" },
    include: { scans: true, registrations: true },
  });
  console.log(
    `\nDemo attendee: id=${demo?.id} scans=${demo?.scans.length} registrations=${demo?.registrations.length} accounts=n/a`,
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
