import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/db";
import { parseShareToken } from "@/lib/share/token";

/** Public badge detail shared by the badge page and its OpenGraph image. */
export async function loadPublicEventBadge(eventBadgeId: string) {
  return prisma.eventBadge.findUnique({
    where: { id: eventBadgeId },
    include: { badge: true, event: true },
  });
}

export interface ShareCollectionBadge {
  name: string;
  type: string;
  xpValue: number;
}

export interface ShareCollection {
  attendeeName: string;
  eventName: string;
  eventDate: string;
  collected: number;
  total: number;
  xp: number;
  badges: ShareCollectionBadge[];
}

export async function loadShareCollection(
  token: string,
): Promise<ShareCollection | null> {
  const payload = parseShareToken(token);

  if (!payload) {
    return null;
  }

  const registration = await prisma.registration.findUnique({
    where: {
      userId_eventId: {
        userId: payload.userId,
        eventId: payload.eventId,
      },
    },
    select: {
      user: { select: { name: true } },
      event: { select: { name: true, startsAt: true } },
    },
  });

  if (!registration) {
    return null;
  }

  const [scans, total] = await Promise.all([
    prisma.scan.findMany({
      where: { userId: payload.userId, eventId: payload.eventId },
      orderBy: { scannedAt: "asc" },
      select: {
        xpAwarded: true,
        eventBadge: {
          select: {
            badge: {
              select: { name: true, type: true, xpValue: true },
            },
          },
        },
      },
    }),
    prisma.eventBadge.count({ where: { eventId: payload.eventId } }),
  ]);

  const badges = scans.map((scan) => ({
    name: scan.eventBadge.badge.name,
    type: scan.eventBadge.badge.type,
    xpValue: scan.eventBadge.badge.xpValue,
  }));

  return {
    attendeeName: registration.user.name.trim() || "A Lyfter attendee",
    eventName: registration.event.name,
    eventDate: formatDate(registration.event.startsAt),
    collected: badges.length,
    total,
    xp: scans.reduce((sum, scan) => sum + scan.xpAwarded, 0),
    badges,
  };
}
