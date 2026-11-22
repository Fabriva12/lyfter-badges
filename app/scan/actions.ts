"use server";

import { prisma } from "@/lib/db";
import { resolveScanTarget, type ScanTarget } from "@/lib/scan/target";
import { getSession } from "@/lib/session";

export type { ScanTarget };

export async function resolveScanToken(token: string): Promise<ScanTarget> {
  const session = await getSession();
  const normalized = token.trim();

  if (!session || normalized.length === 0 || normalized.length > 200) {
    return { status: "invalid" };
  }

  const qr = await prisma.qrToken.findUnique({
    where: { token: normalized },
    select: {
      token: true,
      kind: true,
      active: true,
      startsAt: true,
      expiresAt: true,
      eventId: true,
      eventBadgeId: true,
      eventBadge: { select: { startsAt: true } },
      event: { select: { name: true } },
    },
  });

  if (!qr) {
    return { status: "invalid" };
  }

  let isRegistered = false;

  if (qr.active && qr.kind === "BADGE") {
    const registration = await prisma.registration.findUnique({
      where: {
        userId_eventId: { userId: session.user.id, eventId: qr.eventId },
      },
      select: { id: true },
    });
    isRegistered = registration !== null;
  }

  return resolveScanTarget(
    {
      token: qr.token,
      kind: qr.kind,
      active: qr.active,
      startsAt: qr.startsAt,
      expiresAt: qr.expiresAt,
      badgeStartsAt: qr.eventBadge?.startsAt ?? null,
      hasBadge: qr.eventBadgeId !== null,
      eventName: qr.event.name,
    },
    isRegistered,
  );
}
