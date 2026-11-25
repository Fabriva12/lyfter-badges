import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Notice from "@/components/admin/Notice";
import StandVisits from "@/components/admin/StandVisits";
import StatCard from "@/components/admin/StatCard";
import TokenCard from "@/components/admin/TokenCard";
import { cardClassName } from "@/components/admin/formStyles";
import { formatDateTime, formatEventRange } from "@/lib/admin/format";
import { requireStandForAdmin } from "@/lib/admin/guards";
import { getStandDetail } from "@/lib/admin/queries";
import { getRequestOrigin } from "@/lib/request";

export const metadata: Metadata = {
  title: "Stand · Lyfter Badges",
};

interface StandPageProps {
  params: Promise<{ eventBadgeId: string }>;
}

export default async function AdminStandPage({ params }: StandPageProps) {
  const { eventBadgeId } = await params;
  const { stand: guardStand } = await requireStandForAdmin(eventBadgeId);

  const [stand, origin] = await Promise.all([
    getStandDetail(guardStand.id),
    getRequestOrigin(),
  ]);

  if (!stand) {
    notFound();
  }

  const activeTokens = stand.tokens.filter((token) => token.active).length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-muted transition hover:text-foreground"
        >
          ← Tus stands
        </Link>

        <header className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-celeste">
            Stand del socio
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{stand.badge.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {stand.event.name}
            {stand.room ? ` · ${stand.room}` : ""} ·{" "}
            {formatEventRange(stand.event.startsAt, stand.event.endsAt)}
          </p>
          {stand.badge.description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {stand.badge.description}
            </p>
          ) : null}
        </header>
      </div>

      <Notice tone="info">
        Esta vista es de solo lectura. Solo el organizador del evento puede
        crear o desactivar tokens QR y cambiar qué stand te pertenece.
      </Notice>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Escaneos" value={stand.scans} />
        <StatCard label="Visitantes" value={stand.visitors} />
        <StatCard
          label="Tokens QR activos"
          value={activeTokens}
          hint={`${stand.tokens.length} en total`}
        />
        <StatCard label="XP por escaneo" value={`+${stand.badge.xpValue}`} />
      </div>

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-foreground">Tokens QR</h2>
        <p className="mt-1 text-sm text-muted">
          Imprimí estos códigos para el stand. Cada escaneo otorga la insignia
          una vez por asistente.
        </p>

        <ul className="mt-5 space-y-3">
          {stand.tokens.length === 0 ? (
            <li className="text-sm text-muted">
              El organizador todavía no creó un token QR para este stand.
            </li>
          ) : (
            stand.tokens.map((token) => (
              <li key={token.id}>
                <TokenCard
                  token={token}
                  origin={origin}
                  label={stand.badge.name}
                  canToggle={false}
                />
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClassName}>
          <h2 className="text-lg font-bold text-foreground">
            Visitas recientes
          </h2>
          <p className="mt-1 text-sm text-muted">
            Asistentes que escanearon este stand, del más reciente al más
            antiguo.
          </p>
          <div className="mt-4">
            <StandVisits visits={stand.visits} />
          </div>
        </section>

        <section className={cardClassName}>
          <h2 className="text-lg font-bold text-foreground">Event</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Nombre</dt>
              <dd className="font-semibold text-foreground">
                {stand.event.name}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Ubicación</dt>
              <dd className="font-semibold text-foreground">
                {stand.event.location ?? "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Último escaneo</dt>
              <dd className="font-semibold text-foreground">
                {stand.lastScanAt
                  ? formatDateTime(stand.lastScanAt)
                  : "Todavía no hay escaneos"}
              </dd>
            </div>
          </dl>

          <Link
            href={`/leaderboard?event=${stand.event.slug}`}
            className="mt-5 inline-block rounded-lg border border-stroke px-4 py-2 text-sm font-semibold text-subtle transition hover:bg-ink"
          >
            Clasificación pública
          </Link>
        </section>
      </div>
    </div>
  );
}
