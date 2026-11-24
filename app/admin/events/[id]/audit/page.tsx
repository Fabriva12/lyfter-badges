import type { Metadata } from "next";
import Link from "next/link";

import EventTabs from "@/components/admin/EventTabs";
import { cardClassName } from "@/components/admin/formStyles";
import { formatDateTime } from "@/lib/admin/format";
import { requireEventForAdmin } from "@/lib/admin/guards";
import { getEventAuditLogs } from "@/lib/admin/queries";
import { auditActionLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Auditoría · Admin · Lyfter Badges",
};

interface AuditPageProps {
  params: Promise<{ id: string }>;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  ATTENDEE: "Asistente",
};

export default async function AdminAuditPage({ params }: AuditPageProps) {
  const { id } = await params;
  const { event } = await requireEventForAdmin(id);

  const rows = await getEventAuditLogs(event.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/events/${event.id}`}
          className="text-sm font-semibold text-muted transition hover:text-foreground"
        >
          ← {event.name}
        </Link>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Auditoría</h1>
        <p className="mt-2 text-sm text-muted">
          Todas las acciones administrativas en este evento, de la más reciente a
          la más antigua. Las horas se muestran en la hora local de Costa Rica.
          Se muestran las últimas 200 entradas.
        </p>
      </div>

      <EventTabs eventId={event.id} active="audit" />

      <section className={cardClassName}>
        {rows.length === 0 ? (
          <p className="rounded-lg border border-stroke bg-surface-low px-4 py-8 text-center text-sm text-muted">
            Todavía no hay acciones administrativas registradas para este evento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-muted">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Cuándo</th>
                  <th className="py-2 pr-4 font-semibold">Actor</th>
                  <th className="py-2 pr-4 font-semibold">Acción</th>
                  <th className="py-2 font-semibold">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap py-3 pr-4 align-top text-muted">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="py-3 pr-4 align-top text-foreground">
                      {row.actorName}
                      <span className="block text-xs text-muted">
                        {row.actorRole
                          ? (ROLE_LABELS[row.actorRole] ?? row.actorRole)
                          : "Rol desconocido"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <span className="whitespace-nowrap rounded-full bg-celeste/10 px-2.5 py-0.5 text-xs font-semibold text-celeste-soft">
                        {auditActionLabel(row.action)}
                      </span>
                    </td>
                    <td className="py-3 align-top text-subtle">
                      {row.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
