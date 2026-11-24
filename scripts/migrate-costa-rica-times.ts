import "dotenv/config";

import { formatDateTime } from "../lib/date";
import { prisma } from "../lib/db";

const SHIFT_MS = 6 * 60 * 60 * 1000;
const MIGRATION_NAME = "costa-rica-times-2026-v1";
const shouldApply = process.argv.includes("--apply");

function shift(date: Date | null): Date | null {
  return date ? new Date(date.getTime() + SHIFT_MS) : null;
}

async function ensureMarkerTable() {
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "script_migrations" ("name" text PRIMARY KEY, "applied_at" timestamptz NOT NULL DEFAULT now())`;
}

async function isApplied(): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ name: string }>>`SELECT name FROM "script_migrations" WHERE name = ${MIGRATION_NAME}`;

  return rows.length > 0;
}

async function main() {
  await ensureMarkerTable();

  if (await isApplied()) {
    console.log(`La migración ${MIGRATION_NAME} ya fue aplicada.`);
    return;
  }

  const events = await prisma.event.findMany({
    where: {
      OR: [
        { country: { contains: "costa rica", mode: "insensitive" } },
        { location: { contains: "costa rica", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      location: true,
      country: true,
      startsAt: true,
      endsAt: true,
    },
    orderBy: { startsAt: "asc" },
  });

  console.log(`Eventos en Costa Rica: ${events.length}`);

  const plan = await Promise.all(
    events.map(async (event) => {
      const badges = await prisma.eventBadge.findMany({
        where: { eventId: event.id, startsAt: { not: null } },
        select: { id: true, startsAt: true },
      });
      const tokens = await prisma.qrToken.findMany({
        where: {
          eventId: event.id,
          OR: [{ startsAt: { not: null } }, { expiresAt: { not: null } }],
        },
        select: { id: true, startsAt: true, expiresAt: true },
      });

      return { event, badges, tokens };
    }),
  );

  for (const { event, badges, tokens } of plan) {
    console.log(`\n${event.name} (${event.slug})`);
    console.log(`  ubicación: ${event.location ?? "—"}, ${event.country ?? "—"}`);
    console.log(
      `  inicio: ${formatDateTime(event.startsAt)} -> ${formatDateTime(shift(event.startsAt)!)}`,
    );
    console.log(
      `  fin:    ${formatDateTime(event.endsAt)} -> ${formatDateTime(shift(event.endsAt)!)}`,
    );
    console.log(`  horarios de insignias: ${badges.length}`);
    console.log(`  ventanas de tokens QR: ${tokens.length}`);
  }

  if (!shouldApply) {
    console.log("\nSimulación: pasa --apply para guardar los cambios.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const { event, badges, tokens } of plan) {
      await tx.event.update({
        where: { id: event.id },
        data: {
          startsAt: shift(event.startsAt)!,
          endsAt: shift(event.endsAt)!,
        },
      });

      for (const badge of badges) {
        await tx.eventBadge.update({
          where: { id: badge.id },
          data: { startsAt: shift(badge.startsAt) },
        });
      }

      for (const token of tokens) {
        await tx.qrToken.update({
          where: { id: token.id },
          data: {
            startsAt: shift(token.startsAt),
            expiresAt: shift(token.expiresAt),
          },
        });
      }
    }

    await tx.$executeRaw`INSERT INTO "script_migrations" (name) VALUES (${MIGRATION_NAME})`;
  });

  console.log("\nMigración aplicada.");
}

void main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
