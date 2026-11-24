import { formatDateTime } from "@/lib/admin/format";
import type { StandVisit } from "@/lib/admin/queries";

interface StandVisitsProps {
  visits: StandVisit[];
}

export default function StandVisits({ visits }: StandVisitsProps) {
  if (visits.length === 0) {
    return (
      <p className="rounded-lg border border-stroke bg-surface-low px-4 py-6 text-center text-sm text-muted">
        Todavía nadie escaneó este stand.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stroke">
      {visits.map((visit) => (
        <li
          key={visit.id}
          className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
        >
          <span className="font-semibold text-foreground">
            {visit.attendeeName}
          </span>
          <span className="text-muted">
            {formatDateTime(visit.scannedAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
