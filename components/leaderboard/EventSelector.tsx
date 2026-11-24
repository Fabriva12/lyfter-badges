import Link from "next/link";

import type { LeaderboardMetric } from "@/lib/gamification/leaderboard";
import type { EventSummary } from "@/lib/gamification/queries";

import { leaderboardHref } from "./links";

interface EventSelectorProps {
  events: EventSummary[];
  activeSlug: string | null;
  activeMetric: LeaderboardMetric;
}

export default function EventSelector({
  events,
  activeSlug,
  activeMetric,
}: EventSelectorProps) {
  return (
    <nav
      aria-label="Ranking scope"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:gap-3 sm:px-0"
    >
      <Link
        href={leaderboardHref(null, activeMetric)}
        aria-current={activeSlug === null ? "page" : undefined}
        className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
          activeSlug === null
            ? "border-[#36bde9] bg-[#36bde9]/10 text-[#f1f1ed]"
            : "border-[#39424f] bg-[#252c35] text-[#9ca3af] hover:bg-[#272d36] hover:text-[#d7dce3]"
        }`}
      >
        Global
      </Link>

      {events.map((event) => {
        const isActive = event.slug === activeSlug;

        return (
          <Link
            key={event.id}
            href={leaderboardHref(event.slug, activeMetric)}
            aria-current={isActive ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "border-[#36bde9] bg-[#36bde9]/10 text-[#f1f1ed]"
                : "border-[#39424f] bg-[#252c35] text-[#9ca3af] hover:bg-[#272d36] hover:text-[#d7dce3]"
            }`}
          >
            {event.name}
          </Link>
        );
      })}
    </nav>
  );
}
