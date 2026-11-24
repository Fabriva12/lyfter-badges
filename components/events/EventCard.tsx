import Link from "next/link";

import { formatEventRange } from "@/lib/date";
import { EVENT_MODE_LABELS, EVENT_STATUS_LABELS } from "@/lib/format";
import type { EventSummary } from "@/lib/gamification/queries";

interface EventCardProps {
  event: EventSummary;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <article className="flex flex-col rounded-xl border border-stroke bg-surface p-5 sm:p-7">
      <div className="flex-1">
        <h2 className="text-lg font-bold text-foreground">{event.name}</h2>
        <p className="mt-2 text-sm text-muted">
          {formatEventRange(event.startsAt, event.endsAt)}
        </p>
        {event.location ? (
          <p className="mt-1 text-sm text-muted">
            {event.location}
            {event.country ? `, ${event.country}` : ""}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
          <span className="rounded-full border border-stroke px-3 py-1 text-muted">
            {EVENT_MODE_LABELS[event.mode] ?? event.mode}
          </span>
          <span
            className={`rounded-full px-3 py-1 ${
              event.status === "FINISHED"
                ? "bg-stroke text-subtle"
                : "bg-sage/15 text-sage"
            }`}
          >
            {EVENT_STATUS_LABELS[event.status] ?? event.status}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
        <Link
          href={`/leaderboard?event=${event.slug}`}
          className="rounded-lg bg-sage px-4 py-2 text-[#263021] transition hover:bg-sage-soft"
        >
          View leaderboard
        </Link>
        <Link
          href="/collection"
          className="rounded-lg border border-stroke px-4 py-2 text-subtle transition hover:bg-ink"
        >
          My collection
        </Link>
      </div>
    </article>
  );
}
