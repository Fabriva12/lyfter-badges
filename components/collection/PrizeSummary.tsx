import type { EventPrize } from "@/lib/gamification/queries";

export interface PrizeSummaryItem {
  eventId: string;
  eventName: string;
  prize: EventPrize;
}

interface PrizeSummaryProps {
  items: PrizeSummaryItem[];
}

/**
 * Page-level state feedback: how many event prizes the attendee earned and
 * which ones are still hidden.
 */
export default function PrizeSummary({ items }: PrizeSummaryProps) {
  if (items.length === 0) {
    return null;
  }

  const earnedCount = items.filter((item) => item.prize.earned).length;

  return (
    <section className="rounded-xl border border-stroke bg-surface p-5 shadow-2xl shadow-black/30 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Prizes</h2>
          <p className="mt-1 text-sm text-muted">
            {earnedCount} of {items.length} earned. A prize stays hidden until
            you complete the badge set for its event.
          </p>
        </div>

        <p className="text-sm font-semibold text-subtle">
          {earnedCount} / {items.length}
        </p>
      </div>

      <ul className="mt-6 flex flex-wrap gap-3">
        {items.map((item) => {
          const { prize } = item;
          const name = prize.details ? prize.details.name : "Locked prize";

          return (
            <li
              key={item.eventId}
              className={`rounded-lg border px-4 py-3 ${
                prize.earned
                  ? "border-sage/40 bg-sage/10"
                  : prize.revealed
                    ? "border-celeste/40 bg-celeste/10"
                    : "border-stroke bg-surface-low"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  prize.earned
                    ? "text-sage"
                    : prize.revealed
                      ? "text-celeste"
                      : "text-muted"
                }`}
              >
                {name}
              </p>
              <p className="mt-1 text-xs text-muted">{item.eventName}</p>
              <p className="mt-1 text-xs text-muted">
                {prize.earned
                  ? "Earned"
                  : `${prize.badgesToGo} more ${
                      prize.badgesToGo === 1 ? "badge" : "badges"
                    } to go`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
