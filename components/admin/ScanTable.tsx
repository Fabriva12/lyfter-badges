import { formatDateTime } from "@/lib/admin/format";
import type { RecentScan } from "@/lib/admin/queries";

interface ScanTableProps {
  scans: RecentScan[];
  emptyMessage?: string;
}

export default function ScanTable({
  scans,
  emptyMessage = "Todavía no hay escaneos.",
}: ScanTableProps) {
  if (scans.length === 0) {
    return (
      <p className="rounded-lg border border-stroke bg-surface-low px-4 py-6 text-center text-sm text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {scans.map((scan) => (
          <li
            key={scan.id}
            className="rounded-lg border border-stroke bg-surface-low p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {scan.attendeeName}
                </p>
                <p className="truncate text-xs text-muted">
                  {scan.attendeeEmail}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-sage">
                +{scan.xpAwarded}
              </span>
            </div>

            <p className="mt-3 text-sm text-subtle">{scan.badgeName}</p>
            <p className="mt-1 text-xs text-muted">
              {formatDateTime(scan.scannedAt)}
            </p>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted">
            <tr>
              <th className="py-2 pr-4 font-semibold">Asistente</th>
              <th className="py-2 pr-4 font-semibold">Insignia</th>
              <th className="py-2 pr-4 font-semibold">XP</th>
              <th className="py-2 font-semibold">Cuándo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke">
            {scans.map((scan) => (
              <tr key={scan.id}>
                <td className="py-3 pr-4 text-foreground">
                  {scan.attendeeName}
                  <span className="block text-xs text-muted">
                    {scan.attendeeEmail}
                  </span>
                </td>
                <td className="py-3 pr-4 text-subtle">{scan.badgeName}</td>
                <td className="py-3 pr-4 text-sage">+{scan.xpAwarded}</td>
                <td className="py-3 text-muted">
                  {formatDateTime(scan.scannedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
