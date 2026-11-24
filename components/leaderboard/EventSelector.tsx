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
            ? "border-celeste bg-celeste/10 text-foreground"
            : "border-stroke bg-surface text-muted hover:bg-ink hover:text-subtle"
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
                ? "border-celeste bg-celeste/10 text-foreground"
                : "border-stroke bg-surface text-muted hover:bg-ink hover:text-subtle"
            }`}
          >
            {event.name}
          </Link>
        );
      })}
    </nav>
  );
}
