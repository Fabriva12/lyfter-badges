import BadgeEditForm from "@/components/admin/BadgeEditForm";
import CreateTokenForm from "@/components/admin/CreateTokenForm";
import PartnerAssignForm from "@/components/admin/PartnerAssignForm";
import TokenCard from "@/components/admin/TokenCard";
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
        <h4 className="text-sm font-bold text-foreground">Tokens QR</h4>

        <ul className="mt-3 space-y-3">
          {badge.tokens.length === 0 ? (
            <li className="text-sm text-muted">
              Todavía no hay tokens QR. Creá uno para ponerlo en la pared o en
              el stand.
            </li>
          ) : (
            badge.tokens.map((token) => (
              <li key={token.id}>
                <TokenCard
                  token={token}
                  eventId={eventId}
                  origin={origin}
                  label={badge.name}
                />
              </li>
            ))
          )}
        </ul>

        <CreateTokenForm
          eventId={eventId}
          kind="BADGE"
          eventBadgeId={badge.id}
        />
      </div>
    </li>
  );
}
