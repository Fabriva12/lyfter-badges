"use server";

import { prisma } from "@/lib/db";
import { resolveScanTarget, toScanQr, type ScanTarget } from "@/lib/scan/target";
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
      eventBadge: {
        select: { startsAt: true, badge: { select: { id: true } } },
      },
      event: {
        select: {
          name: true,
          status: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
  });

  if (!qr || !qr.active) {
    return { status: "invalid" };
  }

  const [registration, existingScan] = await Promise.all([
    prisma.registration.findUnique({
      where: {
        userId_eventId: { userId: session.user.id, eventId: qr.eventId },
      },
      select: { id: true },
    }),
    qr.eventBadgeId
      ? prisma.scan.findUnique({
          where: {
            userId_eventBadgeId: {
              userId: session.user.id,
              eventBadgeId: qr.eventBadgeId,
            },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const isRegistered = registration !== null;
  const hasExistingClaim =
    qr.kind === "WELCOME" ? isRegistered : existingScan !== null;

  return resolveScanTarget(
    toScanQr(qr),
    isRegistered,
    new Date(),
    hasExistingClaim,
  );
}
