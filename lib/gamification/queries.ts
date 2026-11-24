// Server-side gamification queries. This module DOES import Prisma: it is the
// data-access layer that feeds the pure functions in `levels.ts`,
// `collection.ts` and `leaderboard.ts`. Keep the math out of here.

import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/db";
import {
  collectionProgress,
  prizeReveal,
  type CollectionProgress,
  type PrizeReveal,
} from "@/lib/gamification/collection";
import {
  levelForXp,
  type LevelProgress,
  type LevelThreshold,
} from "@/lib/gamification/levels";
import {
  rankAttendees,
  type LeaderboardEntry,
  type LeaderboardMetric,
  type LeaderboardRanking,
} from "@/lib/gamification/leaderboard";

/**
 * Cache tag for everything tied to one attendee's collection. Server Actions
 * call `updateTag(collectionTag(userId))` after a successful scan, which gives
 * the next read-your-writes render instead of a stale-while-revalidate window.
 */
export function collectionTag(userId: string) {
  return `collection:${userId}`;
}

/**
 * Cache tag for the leaderboard of one event. The leaderboard is shared by
 * every attendee of the event, so it is tagged per event and not per user.
 * A badge claim calls `updateTag(leaderboardTag(eventId))`.
 */
export function leaderboardTag(eventId: string) {
  return `leaderboard:${eventId}`;
}

/**
 * Cache tag for the leaderboard across every event. A scan changes the global
 * XP of one attendee, so it invalidates this tag too.
 */
export function globalLeaderboardTag() {
  return "leaderboard:global";
}

/**
 * Cache tag for the list of events the leaderboard can be scoped to. Creating
 * or editing an event has to invalidate it.
 */
export function eventsTag() {
  return "leaderboard:events";
}

/**
 * Cache tag for the event configuration that every attendee view depends on:
 * event names, enabled badges and prize announcements. Unlike the per-user
 * collection tag, one organizer action changes this payload for every attendee,
 * so it cannot be invalidated per user. Admin actions expire it with
 * `revalidateTag(configTag(), "max")`.
 */
export function configTag() {
  return "gamification:config";
}

/** Full QR payload used by the claim page, including badge and event names. */
export async function getQrTokenForClaim(token: string) {
  return prisma.qrToken.findUnique({
    where: { token },
    include: { event: true, eventBadge: { include: { badge: true } } },
  });
}

/** Whether the attendee already checked in to an event. */
export async function getRegistrationForClaim(userId: string, eventId: string) {
  return prisma.registration.findUnique({
    where: {
      userId_eventId: { userId, eventId },
    },
    select: { id: true },
  });
}

/** Recent check-ins shown above the scanner, newest first. */
export async function getRecentRegistrations(userId: string) {
  return prisma.registration.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { eventId: true, event: { select: { name: true } } },
  });
}

/**
 * `unstable_cache` stores its payload as JSON, so a `Date` comes back as an
 * ISO string on a cache hit. This turns it back into a `Date`.
 */
function reviveDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Turns the cached ISO date of an announced prize back into a `Date`. */
function revivePrize(prize: EventPrize): EventPrize {
  if (!prize.details?.revealedAt) {
    return prize;
  }

  return {
    ...prize,
    details: {
      ...prize.details,
      revealedAt: reviveDate(prize.details.revealedAt),
    },
  };
}

/**
 * Builds the prize payload for one attendee.
 *
 * A prize that is still a secret ships with `details: null`. The name must
 * not leave the server: server component props travel to the browser inside
 * the RSC payload, so a hidden value that is still in the payload is a leak.
 */
function buildEventPrize(
  raw: {
    name: string;
    description: string | null;
    imageUrl: string | null;
    revealedAt: Date | null;
    requiredBadgesCount: number;
  },
  collected: number,
): EventPrize {
  const reveal = prizeReveal({
    collected,
    required: raw.requiredBadgesCount,
    announced: raw.revealedAt !== null,
  });

  return {
    ...reveal,
    details: reveal.revealed
      ? {
          name: raw.name,
          description: raw.description,
          imageUrl: raw.imageUrl,
          revealedAt: raw.revealedAt,
        }
      : null,
  };
}

async function readLevelThresholds(): Promise<LevelThreshold[]> {
  return prisma.level.findMany({
    orderBy: { minXp: "asc" },
    select: { level: true, name: true, minXp: true },
  });
}

/** Global XP: SUM(Scan.xpAwarded) across every event. */
export async function getGlobalXp(userId: string): Promise<number> {
  const aggregate = await prisma.scan.aggregate({
    where: { userId },
    _sum: { xpAwarded: true },
  });

  return aggregate._sum.xpAwarded ?? 0;
}

/** Global level for an attendee, derived from global XP. */
export async function getLevelProgress(userId: string): Promise<LevelProgress> {
  const [xp, thresholds] = await Promise.all([
    getGlobalXp(userId),
    readLevelThresholds(),
  ]);

  return levelForXp(xp, thresholds);
}

/** An event prize plus the reveal state for the attendee reading it. */
export type EventPrize = PrizeReveal & {
  /**
   * Prize details. They are `null` while the prize is still a secret: the
   * name must not leave the server, because the server component payload is
   * readable by anyone who opens the page source.
   */
  details: {
    name: string;
    description: string | null;
    imageUrl: string | null;
    revealedAt: Date | null;
  } | null;
};

export interface EventCollection {
  eventId: string;
  eventName: string;
  eventSlug: string;
  startsAt: Date;
  endsAt: Date;
  progress: CollectionProgress;
  prize: EventPrize | null;
  badges: BadgeCollectionItem[];
}

export interface BadgeCollectionItem {
  eventBadgeId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  room: string | null;
  xpValue: number;
  type: string;
  collected: boolean;
}

/**
 * Per-event badge collection for one attendee.
 *
 * Reads the attendee's registrations, then for each event counts the badges
 * they collected. The collection count is `COUNT(DISTINCT eventBadgeId)`, which
 * is the second of the three cuts over `Scan`.
 */
export async function getEventCollections(
  userId: string,
): Promise<EventCollection[]> {
  const registrations = await prisma.registration.findMany({
    where: { userId },
    orderBy: { event: { startsAt: "desc" } },
    include: {
      event: {
        include: {
          badges: {
            orderBy: { badge: { name: "asc" } },
            include: { badge: true },
          },
          prize: true,
        },
      },
    },
  });

  const collections = await Promise.all(
    registrations.map(async (registration) => {
      const { event } = registration;

      const scans = await prisma.scan.findMany({
        where: { userId, eventId: event.id },
        select: { eventBadgeId: true },
      });

      const scannedEventBadgeIds = new Set(
        scans.map((scan) => scan.eventBadgeId),
      );

      const badges: BadgeCollectionItem[] = event.badges.map((eventBadge) => ({
        eventBadgeId: eventBadge.id,
        name: eventBadge.badge.name,
        description: eventBadge.badge.description,
        imageUrl: eventBadge.badge.imageUrl,
        room: eventBadge.room,
        xpValue: eventBadge.badge.xpValue,
        type: eventBadge.badge.type,
        // A badge counts as collected when the attendee scanned any QR token
        // wired to this event badge. `Scan` is unique per (user, eventBadge),
        // so multiple printed tokens can never award it twice.
        collected: scannedEventBadgeIds.has(eventBadge.id),
      }));

      const collectedCount = badges.filter((badge) => badge.collected).length;
      const progress = collectionProgress(collectedCount, badges.length);

      const prize = event.prize
        ? buildEventPrize(event.prize, collectedCount)
        : null;

      return {
        eventId: event.id,
        eventName: event.name,
        eventSlug: event.slug,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        progress,
        prize,
        badges,
      } satisfies EventCollection;
    }),
  );

  return collections;
}

/**
 * Cached wrapper for the attendee dashboard. Tagged with `collection:${userId}`
 * so a scan invalidates exactly this attendee's view.
 */
export function getCollectionOverview(userId: string) {
  const cached = unstable_cache(
    async () => {
      const [level, collections, totalXp] = await Promise.all([
        getLevelProgress(userId),
        getEventCollections(userId),
        getGlobalXp(userId),
      ]);

      return { level, collections, totalXp };
    },
    ["collection-overview", userId],
    { tags: [collectionTag(userId), configTag()] },
  );

  return cached().then((overview) => ({
    ...overview,
    collections: overview.collections.map((collection) => ({
      ...collection,
      startsAt: reviveDate(collection.startsAt),
      endsAt: reviveDate(collection.endsAt),
      prize: collection.prize ? revivePrize(collection.prize) : null,
    })),
  }));
}

export interface EventSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  country: string | null;
  mode: string;
  status: string;
}

/**
 * Events the leaderboard can be scoped to, newest first.
 *
 * Events without scans are listed too: the selector offers every event and
 * its leaderboard simply stays empty until somebody scans a badge.
 */
export async function getEventSummaries(): Promise<EventSummary[]> {
  const cached = unstable_cache(
    async () => {
      const events = await prisma.event.findMany({
        // Drafts stay private until the organizer publishes the event.
        where: { status: { not: "DRAFT" } },
        orderBy: { startsAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          startsAt: true,
          endsAt: true,
          location: true,
          country: true,
          mode: true,
          status: true,
        },
      });

      return events.map((event) => ({
        id: event.id,
        name: event.name,
        slug: event.slug,
        description: event.description,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt.toISOString(),
        location: event.location,
        country: event.country,
        mode: event.mode,
        status: event.status,
      }));
    },
    ["event-summaries"],
    { tags: [eventsTag()] },
  );

  const events = await cached();

  return events.map((event) => ({
    id: event.id,
    name: event.name,
    slug: event.slug,
    description: event.description,
    startsAt: reviveDate(event.startsAt),
    endsAt: reviveDate(event.endsAt),
    location: event.location,
    country: event.country,
    mode: event.mode,
    status: event.status,
  }));
}

/**
 * Raw leaderboard rows for one scope.
 *
 * The scope is either one event (`eventId`) or the whole platform (`null`).
 * This is the second cut over `Scan`: `WHERE eventId = X` for a single event,
 * never across the whole table. `Scan` has `@@unique([userId, eventBadgeId])`,
 * so there is exactly one row per attendee and badge, which means the count
 * of rows per attendee is the count of distinct badges they collected. A badge
 * with several QR tokens still counts once.
 *
 * Stands and talks are the same count filtered by `Badge.type`. `WELCOME` and
 * `SPECIAL` badges add XP and badge count, but they are not a stand visit or a
 * talk attendance.
 *
 * The order is not computed here: `rankAttendees` owns that.
 */
async function readLeaderboard(
  eventId: string | null,
  metric: LeaderboardMetric,
): Promise<LeaderboardRanking> {
  const where = eventId ? { eventId } : {};

  const [grouped, stands, talks] = await Promise.all([
    prisma.scan.groupBy({
      by: ["userId"],
      where,
      _sum: { xpAwarded: true },
      _count: { eventBadgeId: true },
    }),
    prisma.scan.groupBy({
      by: ["userId"],
      where: { ...where, eventBadge: { badge: { type: "STAND" } } },
      _count: { eventBadgeId: true },
    }),
    prisma.scan.groupBy({
      by: ["userId"],
      where: { ...where, eventBadge: { badge: { type: "TALK" } } },
      _count: { eventBadgeId: true },
    }),
  ]);

  const userIds = grouped.map((group) => group.userId);

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  });

  const usersById = new Map(users.map((user) => [user.id, user]));
  const standsByUser = new Map(
    stands.map((group) => [group.userId, group._count.eventBadgeId]),
  );
  const talksByUser = new Map(
    talks.map((group) => [group.userId, group._count.eventBadgeId]),
  );

  const entries: LeaderboardEntry[] = [];

  for (const group of grouped) {
    const user = usersById.get(group.userId);

    // The foreign key guarantees the user exists. A missing row means the
    // data drifted, so it is skipped instead of rendered nameless.
    if (!user) {
      continue;
    }

    entries.push({
      userId: user.id,
      name: user.name,
      image: user.image,
      xp: group._sum.xpAwarded ?? 0,
      badges: group._count.eventBadgeId,
      stands: standsByUser.get(group.userId) ?? 0,
      talks: talksByUser.get(group.userId) ?? 0,
    });
  }

  return rankAttendees(entries, metric);
}

/**
 * Cached per-event leaderboard. Tagged with `leaderboard:${eventId}` so a
 * badge claim invalidates exactly the ranking of the event it belongs to.
 * The metric is part of the cache key because it changes the row order.
 */
export function getLeaderboard(
  eventId: string,
  metric: LeaderboardMetric = "xp",
): Promise<LeaderboardRanking> {
  const cached = unstable_cache(
    async () => readLeaderboard(eventId, metric),
    ["leaderboard", eventId, metric],
    { tags: [leaderboardTag(eventId)] },
  );

  return cached();
}

/**
 * Cached global leaderboard. Every event counts, so it answers the "who has
 * the most XP, stands or talks on the platform" question instead of the
 * per-event ranking.
 */
export function getGlobalLeaderboard(
  metric: LeaderboardMetric = "xp",
): Promise<LeaderboardRanking> {
  const cached = unstable_cache(
    async () => readLeaderboard(null, metric),
    ["leaderboard-global", metric],
    { tags: [globalLeaderboardTag()] },
  );

  return cached();
}
