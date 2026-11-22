import type { Metadata } from "next";
import Link from "next/link";

import EventTabs from "@/components/admin/EventTabs";
import Notice from "@/components/admin/Notice";
import PrizeForm from "@/components/admin/PrizeForm";
import { cardClassName } from "@/components/admin/formStyles";
import { formatDateTime } from "@/lib/admin/format";
import { requireEventForAdmin } from "@/lib/admin/guards";
import { getPrizeAdmin } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Premio · Admin · Lyfter Badges",
};

interface PrizePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}

export default async function AdminPrizePage({
  params,
  searchParams,
}: PrizePageProps) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { event } = await requireEventForAdmin(id);
  const { prize, badgeCount } = await getPrizeAdmin(event.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/events/${event.id}`}
          className="text-sm font-semibold text-[#9ca3af] transition hover:text-[#f1f1ed]"
        >
          ← {event.name}
        </Link>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Premio</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Un premio por evento. Los asistentes lo ven cuando completan el
          conjunto, o antes si lo anuncias.
        </p>
      </div>

      {saved === "1" ? (
        <Notice tone="success">Premio guardado.</Notice>
      ) : null}

      <EventTabs eventId={event.id} active="prize" />

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-[#f1f1ed]">Estado actual</h2>

        {!prize ? (
          <p className="mt-2 text-sm text-[#9ca3af]">
            Todavía no hay un premio configurado. La colección de los asistentes
            no muestra ninguna tarjeta de premio para este evento.
          </p>
        ) : (
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-widest text-[#9ca3af]">
                Visibilidad para los asistentes
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[#f1f1ed]">
                {prize.revealedAt
                  ? "Anunciado a todos"
                  : "Secreto hasta completar el conjunto"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-[#9ca3af]">
                Requisito
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[#f1f1ed]">
                {prize.requiredBadgesCount} de {badgeCount} insignias
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-[#9ca3af]">
                Anunciado el
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[#f1f1ed]">
                {prize.revealedAt
                  ? formatDateTime(prize.revealedAt)
                  : "No anunciado"}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <div className="max-w-3xl">
        <PrizeForm
          eventId={event.id}
          badgeCount={badgeCount}
          prize={prize}
        />
      </div>
    </div>
  );
}
