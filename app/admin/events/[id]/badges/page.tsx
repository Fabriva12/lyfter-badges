import type { Metadata } from "next";
import Link from "next/link";

import AddBadgeForm from "@/components/admin/AddBadgeForm";
import BadgeAdminCard from "@/components/admin/BadgeAdminCard";
import CreateTokenForm from "@/components/admin/CreateTokenForm";
import EventTabs from "@/components/admin/EventTabs";
import Notice from "@/components/admin/Notice";
import TokenCard from "@/components/admin/TokenCard";
import { cardClassName } from "@/components/admin/formStyles";
import { requireEventForAdmin } from "@/lib/admin/guards";
import {
  getBadgeCatalog,
  getEventBadgesAdmin,
  getStandPartnerOptions,
  getWelcomeTokens,
} from "@/lib/admin/queries";
import { getRequestOrigin } from "@/lib/request";

export const metadata: Metadata = {
  title: "Insignias y QR · Admin · Lyfter Badges",
};

interface BadgesPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}

const SAVED_MESSAGES: Record<string, string> = {
  badge: "Insignia agregada al evento.",
  "badge-updated": "Insignia actualizada.",
  "badge-removed": "Insignia eliminada del evento.",
  token: "Tokens QR actualizados.",
  partner: "Socio del stand actualizado.",
};

export default async function AdminBadgesPage({
  params,
  searchParams,
}: BadgesPageProps) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { event } = await requireEventForAdmin(id);

  const [badges, welcomeTokens, catalog, partners, origin] = await Promise.all([
    getEventBadgesAdmin(event.id),
    getWelcomeTokens(event.id),
    getBadgeCatalog(),
    getStandPartnerOptions(),
    getRequestOrigin(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/events/${event.id}`}
          className="text-sm font-semibold text-muted transition hover:text-foreground"
        >
          ← {event.name}
        </Link>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Insignias y QR</h1>
        <p className="mt-2 text-sm text-muted">
          Las insignias se reclaman con el QR rotatorio de cada stand o charla;
          acá solo se crea el token de bienvenida para la entrada. Los códigos
          fijos heredados se listan como referencia.
        </p>
      </div>

      {saved && SAVED_MESSAGES[saved] ? (
        <Notice tone="success">{SAVED_MESSAGES[saved]}</Notice>
      ) : null}

      <EventTabs eventId={event.id} active="badges" />

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-foreground">Agregar una insignia</h2>
        <p className="mt-1 text-sm text-muted">
          Elige un nombre del catálogo o escribe uno nuevo.
        </p>

        <div className="mt-5">
          <AddBadgeForm eventId={event.id} catalog={catalog} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          Insignias del evento ({badges.length})
        </h2>

        {badges.length === 0 ? (
          <p className="rounded-xl border border-stroke bg-surface px-4 py-8 text-center text-sm text-muted">
            Este evento todavía no tiene insignias. Agrega la primera arriba.
          </p>
        ) : (
          <ul className="space-y-4">
            {badges.map((badge) => (
              <BadgeAdminCard
                key={badge.id}
                badge={badge}
                eventId={event.id}
                origin={origin}
                partners={partners}
              />
            ))}
          </ul>
        )}
      </section>

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-foreground">QR de bienvenida</h2>
        <p className="mt-1 text-sm text-muted">
          Un token de bienvenida registra la entrada del asistente. No otorga XP;
          las insignias solo cuentan después del registro.
        </p>

        <ul className="mt-5 space-y-3">
          {welcomeTokens.length === 0 ? (
            <li className="text-sm text-muted">
              Todavía no hay token de bienvenida. Crea uno para la entrada del evento.
            </li>
          ) : (
            welcomeTokens.map((token) => (
              <li key={token.id}>
                <TokenCard
                  token={token}
                  eventId={event.id}
                  origin={origin}
                  label="Registro de bienvenida"
                />
              </li>
            ))
          )}
        </ul>

        <CreateTokenForm eventId={event.id} kind="WELCOME" />
      </section>
    </div>
  );
}
