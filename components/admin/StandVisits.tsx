import { formatDateTime } from "@/lib/admin/format";
import type { StandVisit } from "@/lib/admin/queries";

interface StandVisitsProps {
  visits: StandVisit[];
}

export default function StandVisits({ visits }: StandVisitsProps) {
  if (visits.length === 0) {
    return (
      <p className="rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-6 text-center text-sm text-[#9ca3af]">
        Todavía nadie escaneó este stand.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[#303743]">
      {visits.map((visit) => (
        <li
          key={visit.id}
          className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
        >
          <span className="font-semibold text-[#f1f1ed]">
            {visit.attendeeName}
          </span>
          <span className="text-[#9ca3af]">
            {formatDateTime(visit.scannedAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
