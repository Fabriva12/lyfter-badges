import type { Metadata } from "next";
import Link from "next/link";

import StatCard from "@/components/admin/StatCard";
import { cardClassName } from "@/components/admin/formStyles";
import { formatDateTime } from "@/lib/admin/format";
import { requireSuperAdmin } from "@/lib/admin/guards";
import { getAllEventSummaries } from "@/lib/admin/queries";

const EVENT_STATUS_LABELS_ES: Record<string, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  FINISHED: "Finalizado",
};

export const metadata: Metadata = {
  title: "Eventos · Super admin · Lyfter Badges",
};

export default async function SuperAdminEventsPage() {
  await requireSuperAdmin();
  const events = await getAllEventSummaries();

  const totals = events.reduce(
    (accumulator, event) => ({
      attendees: accumulator.attendees + event.attendees,
      scans: accumulator.scans + event.scans,
      badges: accumulator.badges + event.badges,
    }),
    { attendees: 0, scans: 0, badges: 0 },
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
          Super admin
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Todos los eventos</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Abre cualquier evento como super admin, sin importar su empresa.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Eventos"
          value={events.length}
          hint={`${totals.badges} badges`}
        />
        <StatCard label="Asistentes" value={totals.attendees} />
        <StatCard label="Escaneos" value={totals.scans} />
      </div>

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-[#f1f1ed]">Todos los eventos</h2>

        {events.length === 0 ? (
          <p className="mt-4 rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-8 text-center text-sm text-[#9ca3af]">
            Todavía no hay eventos creados.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#303743]">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="font-semibold text-[#f1f1ed] transition hover:text-[#7fd8f5]"
                  >
                    {event.name}
                  </Link>
                  <p className="text-sm text-[#9ca3af]">
                    {event.companyName ?? "Sin empresa"} ·{" "}
                    {EVENT_STATUS_LABELS_ES[
                      event.status as keyof typeof EVENT_STATUS_LABELS_ES
                    ] ?? event.status}
                  </p>
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    Inicio: {formatDateTime(event.startsAt)} · Fin:{" "}
                    {formatDateTime(event.endsAt)}
                  </p>
                </div>
                <span className="text-xs text-[#9ca3af]">
                  {event.badges} badges · {event.attendees} asistentes ·{" "}
                  {event.scans} escaneos
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
