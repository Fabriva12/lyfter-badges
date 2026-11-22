import type { Metadata } from "next";
import Link from "next/link";

import BadgeTypeBreakdown from "@/components/collection/BadgeTypeBreakdown";
import EventCollectionCard from "@/components/collection/EventCollectionCard";
import LevelCard from "@/components/collection/LevelCard";
import PrizeSummary from "@/components/collection/PrizeSummary";
import {
  getCollectionOverview,
  getGlobalLeaderboard,
} from "@/lib/gamification/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "My collection · Lyfter Badges",
};

export default async function CollectionPage() {
  const session = await requireSession();
  const [{ level, collections, totalXp }, globalRanking] = await Promise.all([
    getCollectionOverview(session.user.id),
    getGlobalLeaderboard(),
  ]);

  const hasCollections = collections.length > 0;
  const globalPosition =
    globalRanking.rows.find((row) => row.userId === session.user.id)
      ?.position ?? null;

  const typeCounts = new Map<string, number>();
  for (const collection of collections) {
    for (const badge of collection.badges) {
      if (badge.collected) {
        typeCounts.set(badge.type, (typeCounts.get(badge.type) ?? 0) + 1);
      }
    }
  }
  const typeBreakdown = [...typeCounts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => a.type.localeCompare(b.type));

  const prizeItems = collections.flatMap((collection) =>
    collection.prize
      ? [
          {
            eventId: collection.eventId,
            eventName: collection.eventName,
            prize: collection.prize,
          },
        ]
      : [],
  );

  return (
    <main className="min-h-screen bg-[#171b21] text-[#f1f1ed]">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:py-16">
        <header className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">My collection</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#9ca3af]">
              Level up across every Lyfter event. XP is global; badges belong to
              the event where you collected them.
            </p>
          </div>

          <Link
            href="/scan"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#a8d889] px-5 text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a]"
          >
            Scan a QR
          </Link>
        </header>

        <div className="space-y-6 sm:space-y-8">
          <LevelCard
            level={level}
            totalXp={totalXp}
            globalPosition={globalPosition}
            totalPlayers={globalRanking.rows.length}
          />

          <BadgeTypeBreakdown items={typeBreakdown} />

          <PrizeSummary items={prizeItems} />

          {hasCollections ? (
            collections.map((collection) => (
              <EventCollectionCard
                key={collection.eventId}
                collection={collection}
                userId={session.user.id}
              />
            ))
          ) : (
            <section className="rounded-xl border border-[#39424f] bg-[#252c35] p-5 text-center shadow-2xl shadow-black/30 sm:p-8">
              <h2 className="text-lg font-bold text-[#f1f1ed]">
                You have not checked in to any event yet.
              </h2>
              <p className="mt-2 text-sm text-[#9ca3af]">
                Scan the welcome QR at a Lyfter event entrance to start
                collecting badges.
              </p>
              <Link
                href="/scan"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#a8d889] px-6 text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a]"
              >
                Scan the welcome QR
              </Link>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
