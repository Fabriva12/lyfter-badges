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

const USER_ID = "PpHejLbCYpVzfBgQ24RUAOx4LJMwaP3t";

async function main() {
  // Exactly the query getGlobalXp runs.
  const aggregate = await prisma.scan.aggregate({
    where: { userId: USER_ID },
    _sum: { xpAwarded: true },
  });
  console.log(`aggregate _sum: ${JSON.stringify(aggregate._sum)}`);

  const count = await prisma.scan.count({ where: { userId: USER_ID } });
  console.log(`scan count for user: ${count}`);

  const raw = await prisma.scan.findMany({ where: { userId: USER_ID } });
  console.log(`raw scans: ${JSON.stringify(raw.map((s) => ({ id: s.id, userId: s.userId, xp: s.xpAwarded })))}`);

  const regs = await prisma.registration.findMany({ where: { userId: USER_ID } });
  console.log(`registrations: ${regs.length}`);

  // Check the user row itself.
  const user = await prisma.user.findUnique({ where: { id: USER_ID } });
  console.log(`user: ${JSON.stringify(user)}`);

  // Group-by to double-check the sum.
  const grouped = await prisma.scan.groupBy({
    by: ["userId"],
    _sum: { xpAwarded: true },
  });
  console.log(`groupBy: ${JSON.stringify(grouped)}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
