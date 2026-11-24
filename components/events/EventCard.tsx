import Link from "next/link";

import { formatEventRange } from "@/lib/date";
import { EVENT_MODE_LABELS, EVENT_STATUS_LABELS } from "@/lib/format";
import type { EventSummary } from "@/lib/gamification/queries";

interface EventCardProps {
  event: EventSummary;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <article className="flex flex-col rounded-xl border border-[#39424f] bg-[#252c35] p-5 sm:p-7">
      <div className="flex-1">
        <h2 className="text-lg font-bold text-[#f1f1ed]">{event.name}</h2>
        <p className="mt-2 text-sm text-[#9ca3af]">
          {formatEventRange(event.startsAt, event.endsAt)}
        </p>
        {event.location ? (
          <p className="mt-1 text-sm text-[#9ca3af]">
            {event.location}
            {event.country ? `, ${event.country}` : ""}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
          <span className="rounded-full border border-[#39424f] px-3 py-1 text-[#9ca3af]">
            {EVENT_MODE_LABELS[event.mode] ?? event.mode}
          </span>
          <span
            className={`rounded-full px-3 py-1 ${
              event.status === "FINISHED"
                ? "bg-[#39424f] text-[#d7dce3]"
                : "bg-[#a8d889]/15 text-[#a8d889]"
            }`}
          >
            {EVENT_STATUS_LABELS[event.status] ?? event.status}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
        <Link
          href={`/leaderboard?event=${event.slug}`}
          className="rounded-lg bg-[#a8d889] px-4 py-2 text-[#263021] transition hover:bg-[#b8e39a]"
        >
          View leaderboard
        </Link>
        <Link
          href="/collection"
          className="rounded-lg border border-[#394351] px-4 py-2 text-[#d7dce3] transition hover:bg-[#272d36]"
        >
          My collection
        </Link>
      </div>
    </article>
  );
}
