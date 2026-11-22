"use server";

import { updateTag } from "next/cache";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { ScanFormState } from "@/lib/forms";
import {
  collectionTag,
  getLevelProgress,
  globalLeaderboardTag,
  leaderboardTag,
} from "@/lib/gamification/queries";
import { getSession } from "@/lib/session";

const INVALID_QR = "This QR code is not valid.";
const INACTIVE_QR = "This QR code is not valid or is no longer active.";
const MISCONFIGURED_QR = "This QR code is not configured correctly.";
const NEEDS_CHECK_IN =
  "Scan the welcome QR at the entrance before collecting badges.";
const SCAN_LIMIT = "This QR code has reached its scan limit.";
const UNAUTHENTICATED = "Your session expired. Please sign in again.";
const UNEXPECTED_ERROR = "Something went wrong. Please try again.";

// Prisma reports unique-constraint violations as P2002 errors.
function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function recordScan(rawToken: string): Promise<ScanFormState> {
  const token = typeof rawToken === "string" ? rawToken.trim() : "";

  if (!token || token.length > 200) {
    return {
      status: "error",
      message: INVALID_QR,
      retryable: false,
      reason: "invalid",
    };
  }

  const session = await getSession();

  if (!session) {
    return {
      status: "error",
      message: UNAUTHENTICATED,
      retryable: false,
      reason: "unauthenticated",
    };
  }

  const userId = session.user.id;

  try {
    const qr = await prisma.qrToken.findUnique({
      where: { token },
      include: { event: true, eventBadge: { include: { badge: true } } },
    });

    if (!qr || !qr.active) {
      return {
        status: "error",
        message: INACTIVE_QR,
        retryable: false,
        reason: "inactive",
      };
    }

    if (qr.kind === "WELCOME") {
      let alreadyCheckedIn = false;

      try {
        await prisma.registration.create({
          data: { userId, eventId: qr.eventId },
        });
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }
        // A duplicate registration just means the attendee was already checked in.
        alreadyCheckedIn = true;
      }

      // A welcome QR creates a registration and no `Scan`, so the
      // leaderboard of the event does not change here.
      updateTag(collectionTag(userId));

      return {
        status: "checked-in",
        eventName: qr.event.name,
        alreadyCheckedIn,
      };
    }

    if (!qr.eventBadge?.badge) {
      return {
        status: "error",
        message: MISCONFIGURED_QR,
        retryable: false,
        reason: "misconfigured",
      };
    }

    const eventBadge = qr.eventBadge;

    const badgePayload = {
      eventBadgeId: eventBadge.id,
      name: qr.eventBadge.badge.name,
      description: qr.eventBadge.badge.description,
      imageUrl: qr.eventBadge.badge.imageUrl,
      room: qr.eventBadge.room,
      xpAwarded: qr.eventBadge.badge.xpValue,
    };

    const existingByBadge = await prisma.scan.findUnique({
      where: {
        userId_eventBadgeId: {
          userId,
          eventBadgeId: eventBadge.id,
        },
      },
      select: { id: true, xpAwarded: true },
    });

    if (existingByBadge) {
      updateTag(collectionTag(userId));
      updateTag(leaderboardTag(qr.eventId));
      updateTag(globalLeaderboardTag());

      return {
        status: "collected",
        alreadyCollected: true,
        eventName: qr.event.name,
        badge: { ...badgePayload, xpAwarded: existingByBadge.xpAwarded },
      };
    }

    const now = new Date();

    if (qr.startsAt && now < qr.startsAt) {
      return {
        status: "error",
        message: "This QR code is not available yet.",
        retryable: false,
        reason: "not_started",
      };
    }

    if (qr.expiresAt && now > qr.expiresAt) {
      return {
        status: "error",
        message: "This QR code has expired.",
        retryable: false,
        reason: "expired",
      };
    }

    if (eventBadge.startsAt && now < eventBadge.startsAt) {
      return {
        status: "error",
        message: "This badge is not available yet.",
        retryable: false,
        reason: "not_started",
      };
    }

    const registration = await prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId: qr.eventId } },
    });

    if (!registration) {
      return {
        status: "error",
        message: NEEDS_CHECK_IN,
        retryable: false,
        reason: "needs_check_in",
      };
    }

    const previousLevel = await getLevelProgress(userId);

    let alreadyCollected = false;
    let xpAwarded = badgePayload.xpAwarded;

    try {
      const claim = await prisma.$transaction(async (tx) => {
        // Lock the QR row so concurrent claims cannot all pass the cap check.
        await tx.$queryRaw`SELECT id FROM "QrToken" WHERE id = ${qr.id} FOR UPDATE`;

        if (qr.maxScans !== null) {
          const scanCount = await tx.scan.count({
            where: { qrTokenId: qr.id },
          });

          if (scanCount >= qr.maxScans) {
            return { limited: true as const };
          }
        }

        await tx.scan.create({
          data: {
            userId,
            qrTokenId: qr.id,
            eventBadgeId: eventBadge.id,
            eventId: qr.eventId,
            xpAwarded: badgePayload.xpAwarded,
          },
        });

        return { limited: false as const };
      });

      if (claim.limited) {
        return {
          status: "error",
          message: SCAN_LIMIT,
          retryable: false,
          reason: "scan_limit",
        };
      }
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
      // A P2002 here can mean two different things: the same user scanned this
      // same QR again, or they scanned another QR of the same badge. Both are
      // idempotent successes. The badge key wins when both rows exist, because
      // that is the XP the attendee actually earned for this badge.
      alreadyCollected = true;

      const existingByBadge = await prisma.scan.findUnique({
        where: {
          userId_eventBadgeId: {
            userId,
            eventBadgeId: eventBadge.id,
          },
        },
        select: { xpAwarded: true },
      });

      if (existingByBadge) {
        xpAwarded = existingByBadge.xpAwarded;
      } else {
        const existingByToken = await prisma.scan.findUnique({
          where: { userId_qrTokenId: { userId, qrTokenId: qr.id } },
          select: { xpAwarded: true },
        });

        if (existingByToken) {
          xpAwarded = existingByToken.xpAwarded;
        }
      }
    }

    const currentLevel = await getLevelProgress(userId);

    // The scan changes the XP and the badge count of the attendee inside
    // this event, so both the collection and the leaderboard of the event
    // are invalidated for a read-your-writes render.
    updateTag(collectionTag(userId));
    updateTag(leaderboardTag(qr.eventId));
    updateTag(globalLeaderboardTag());

    return {
      status: "collected",
      alreadyCollected,
      eventName: qr.event.name,
      badge: { ...badgePayload, xpAwarded },
      ...(currentLevel.level > previousLevel.level
        ? {
            levelUp: {
              level: currentLevel.level,
              name: currentLevel.name,
              minXp: currentLevel.minXp,
            },
          }
        : {}),
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: UNEXPECTED_ERROR,
      retryable: true,
      reason: "unexpected",
    };
  }
}
