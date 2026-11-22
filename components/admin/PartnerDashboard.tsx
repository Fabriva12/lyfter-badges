import Link from "next/link";

import StatCard from "@/components/admin/StatCard";
import { cardClassName } from "@/components/admin/formStyles";
import { formatEventRange } from "@/lib/admin/format";
import type { StandSummary } from "@/lib/admin/queries";

interface PartnerDashboardProps {
  stands: StandSummary[];
}

export default function PartnerDashboard({ stands }: PartnerDashboardProps) {
  const totals = stands.reduce(
    (accumulator, stand) => ({
      scans: accumulator.scans + stand.scans,
      visitors: accumulator.visitors + stand.visitors,
    }),
    { scans: 0, visitors: 0 },
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
          Consola de stand
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Tus stands</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Tráfico de las insignias asignadas a vos. Un admin de stand solo ve su
          stand, nunca el resto del evento.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Stands" value={stands.length} />
        <StatCard
          label="Escaneos totales"
          value={totals.scans}
          hint={`${totals.visitors} registros de visitantes`}
        />
      </div>

      {stands.length === 0 ? (
        <p className="rounded-xl border border-[#39424f] bg-[#252c35] px-4 py-8 text-center text-sm text-[#9ca3af]">
          Todavía no se asignó ningún stand a tu cuenta. Pedí al admin del evento
          que vincule tu cuenta a un stand.
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {stands.map((stand) => (
            <li key={stand.id} className={cardClassName}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#f1f1ed]">
                    {stand.badgeName}
                  </h2>
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    {stand.eventName}
                    {stand.room ? ` · ${stand.room}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    {formatEventRange(stand.startsAt, stand.endsAt)}
                  </p>
                </div>
                <span className="rounded-full bg-[#36bde9]/10 px-3 py-1 text-xs font-semibold text-[#7fd8f5]">
                  +{stand.xpValue} XP
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-[#1f252d] px-2 py-3">
                  <dt className="text-xs text-[#9ca3af]">Escaneos</dt>
                  <dd className="mt-1 text-lg font-bold">{stand.scans}</dd>
                </div>
                <div className="rounded-lg bg-[#1f252d] px-2 py-3">
                  <dt className="text-xs text-[#9ca3af]">Visitantes</dt>
                  <dd className="mt-1 text-lg font-bold">{stand.visitors}</dd>
                </div>
              </dl>

              <Link
                href={`/admin/stands/${stand.id}`}
                className="mt-5 inline-block rounded-lg bg-[#a8d889] px-4 py-2 text-sm font-semibold text-[#263021] transition hover:bg-[#b8e39a]"
              >
                Abrir stand
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
