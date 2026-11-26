import Link from "next/link";

import BadgeEditForm from "@/components/admin/BadgeEditForm";
import PartnerAssignForm from "@/components/admin/PartnerAssignForm";
import TokenCard from "@/components/admin/TokenCard";
import { secondaryButtonClassName } from "@/components/admin/formStyles";
import { formatDateTime } from "@/lib/admin/format";
import { toLocalInputValue } from "@/lib/date";
import type { AdminBadge } from "@/lib/admin/queries";
import { BadgeIcon } from "@/lib/badges/icons";
import { BADGE_RARITY_LABELS, BADGE_TYPE_LABELS } from "@/lib/format";

interface BadgeAdminCardProps {
  badge: AdminBadge;
  eventId: string;
  origin: string;
  partners: Array<{ id: string; name: string; email: string }>;
}

export default async function BadgeAdminCard({
  badge,
  eventId,
  origin,
  partners,
}: BadgeAdminCardProps) {
  // Rotating kiosk tokens are secrets for the stand screen. Only tokens without
  // an expiry are inherited static codes, shown here without QR or link; their
  // active state can still be toggled by the organizer.
  const inheritedTokens = badge.tokens.filter(
    (token) => token.expiresAt === null,
  );

  return (
    <li className="rounded-xl border border-stroke bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${
              badge.rarity === "LIMITED"
                ? "border-peach/50 bg-peach/10 text-peach"
                : badge.rarity === "RARE"
                  ? "border-celeste/50 bg-celeste/10 text-celeste-soft"
                  : "border-stroke bg-surface-low text-muted"
            }`}
          >
            <BadgeIcon name={badge.iconKey} className="h-5 w-5" />
          </span>

          <div>
            <h3 className="text-lg font-bold text-foreground">{badge.name}</h3>
            <p className="mt-1 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
              <span className="rounded-full border border-stroke px-2.5 py-0.5 text-muted">
                {BADGE_TYPE_LABELS[badge.type] ?? badge.type}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 ${
                  badge.rarity === "LIMITED"
                    ? "bg-peach/15 text-peach/70"
                    : badge.rarity === "RARE"
                      ? "bg-celeste/15 text-celeste-soft"
                      : "bg-stroke/60 text-subtle"
                }`}
              >
                {BADGE_RARITY_LABELS[badge.rarity] ?? badge.rarity}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted">
              +{badge.xpValue} XP
              {badge.room ? ` · ${badge.room}` : ""}
              {badge.startsAt
                ? ` · Inicio: ${formatDateTime(badge.startsAt)}`
                : ""}
            </p>
            {badge.description ? (
              <p className="mt-1 text-sm text-muted">{badge.description}</p>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-sage">{badge.scans}</p>
          <p className="text-xs text-muted">
            {badge.scans === 1 ? "escaneo" : "escaneos"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <PartnerAssignForm
          eventId={eventId}
          eventBadgeId={badge.id}
          partners={partners}
          currentPartnerId={badge.partner?.id ?? null}
        />
      </div>

      <BadgeEditForm
        eventId={eventId}
        eventBadgeId={badge.id}
        name={badge.name}
        description={badge.description}
        xpValue={badge.xpValue}
        type={badge.type}
        rarity={badge.rarity}
        iconKey={badge.iconKey}
        room={badge.room}
        startsAtValue={badge.startsAt ? toLocalInputValue(badge.startsAt) : ""}
        catalogUsage={badge.catalogUsage}
        scans={badge.scans}
      />

      <div className="mt-6 border-t border-stroke pt-5">
        <h4 className="text-sm font-bold text-foreground">QR rotatorio</h4>
        <p className="mt-1 text-sm text-muted">
          El QR de la insignia se genera en la pantalla del stand, cambia cada
          60 s y tiene vigencia de 90 s. Abrí el kiosk para mostrarlo a los
          asistentes.
        </p>
        <Link
          href={`/stand/${badge.id}`}
          className={`mt-3 inline-block ${secondaryButtonClassName} px-4 py-2 text-xs`}
        >
          Abrir QR rotativo
        </Link>

        {inheritedTokens.length > 0 ? (
          <div className="mt-5">
            <h5 className="text-xs font-bold uppercase tracking-wide text-subtle">
              Códigos fijos heredados
            </h5>
            <p className="mt-1 text-xs text-muted">
              Son códigos estáticos anteriores: se muestran sin QR ni enlace y no
              deben imprimirse ni compartirse. Se mantienen activos para que los
              escaneos previos puedan repetirse de forma idempotente. Un
              organizador puede desactivar uno que nunca se usó, pero no debe
              desactivar uno con escaneos: rompería la idempotencia.
            </p>
            <ul className="mt-3 space-y-3">
              {inheritedTokens.map((token) => (
                <li key={token.id}>
                  <TokenCard
                    token={token}
                    eventId={eventId}
                    origin={origin}
                    label={badge.name}
                    showQr={false}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </li>
  );
}
