import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      // Supabase session pooler caps backend connections at 15, and every warm
      // serverless instance gets its own pool. Keep this at 1 to avoid P2039.
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse the same client across hot reloads in development.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
