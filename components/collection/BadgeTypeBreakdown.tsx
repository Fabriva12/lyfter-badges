import { BADGE_TYPE_LABELS } from "@/lib/format";

interface BadgeTypeBreakdownProps {
  items: Array<{ type: string; count: number }>;
}

export default function BadgeTypeBreakdown({
  items,
}: BadgeTypeBreakdownProps) {
  if (items.length === 0) {
    return null;
  }

  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="rounded-xl border border-stroke bg-surface p-5 shadow-2xl shadow-black/30 sm:p-8">
      <h2 className="text-lg font-bold text-foreground">Badges by type</h2>
      <p className="mt-1 text-sm text-muted">
        {total} collected badge{total === 1 ? "" : "s"} across every event.
      </p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.type}
            className="rounded-lg bg-surface-low px-4 py-3 text-center"
          >
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              {BADGE_TYPE_LABELS[item.type] ?? item.type}
            </dt>
            <dd className="mt-1 text-xl font-bold text-foreground">
              {item.count}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
