// Server-only kiosk service. The printed QR is only a staff entry point; the
// secret is the short-lived token shown on the stand screen. Rotation never
// deactivates a token and never sets maxScans: both would break idempotent
// replays of an already claimed badge.
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import { buildRotationWindow, needsRotation } from "./rotation";

/** ISO strings only: this payload crosses a Server Action boundary. */
export interface StandQrPayload {
  token: string;
  eventBadgeId: string;
  expiresAt: string;
  startsAt: string;
}

interface RotationRow {
  token: string;
  eventBadgeId: string | null;
  startsAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

function toPayload(row: RotationRow, eventBadgeId: string): StandQrPayload {
  if (!row.expiresAt) {
    throw new Error("A rotating QR token must have an expiry");
  }

  return {
    token: row.token,
    eventBadgeId: row.eventBadgeId ?? eventBadgeId,
    expiresAt: row.expiresAt.toISOString(),
    // Legacy tokens can have no startsAt; their creation time is the closest
    // equivalent for the display-only field.
    startsAt: (row.startsAt ?? row.createdAt).toISOString(),
  };
}

function currentTokenQuery(eventBadgeId: string) {
  return {
    where: { eventBadgeId, kind: "BADGE" as const, active: true },
    orderBy: { createdAt: "desc" as const },
    include: { _count: { select: { scans: true } } },
  };
}

/** Returns the live QR, rotating it when forced or when it is expiring. */
export async function getOrRotateStandQr(
  eventBadgeId: string,
  eventId: string,
  now = new Date(),
  force = false,
): Promise<StandQrPayload> {
  const current = await prisma.qrToken.findFirst(
    currentTokenQuery(eventBadgeId),
  );

  if (current && !needsRotation(current.expiresAt, now, force)) {
    return toPayload(current, eventBadgeId);
  }

  const window = buildRotationWindow(now);

  return prisma.$transaction(async (tx) => {
    // Serialize concurrent polls. Rotating an existing row locks that row; the
    // very first QR of a stand has no row to lock, so the parent stand acts as
    // the mutex instead.
    if (current) {
      await tx.$queryRaw`SELECT id FROM "QrToken" WHERE id = ${current.id} FOR UPDATE`;
    } else {
      await tx.$queryRaw`SELECT id FROM "EventBadge" WHERE id = ${eventBadgeId} FOR UPDATE`;
    }

    // Re-read inside the transaction: a competing poll may already have
    // produced a fresh token while we waited for the lock.
    const latest = await tx.qrToken.findFirst(
      currentTokenQuery(eventBadgeId),
    );

    if (latest && !needsRotation(latest.expiresAt, now, force)) {
      return toPayload(latest, eventBadgeId);
    }

    // A token with scans must be kept as its own row: `recordScan` checks the
    // existing claim before the expiry, so offline replays stay idempotent.
    // An unused token can be rewritten in place to bound database growth.
    if (latest && latest._count.scans === 0) {
      return toPayload(
        await tx.qrToken.update({
          where: { id: latest.id },
          data: {
            token: randomUUID(),
            startsAt: window.startsAt,
            expiresAt: window.expiresAt,
          },
        }),
        eventBadgeId,
      );
    }

    return toPayload(
      await tx.qrToken.create({
        data: {
          token: randomUUID(),
          kind: "BADGE",
          eventId,
          eventBadgeId,
          active: true,
          maxScans: null,
          startsAt: window.startsAt,
          expiresAt: window.expiresAt,
        },
      }),
      eventBadgeId,
    );
  });
}
