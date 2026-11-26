import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireStandForAdmin } from "@/lib/admin/guards";
import { getStandDetail } from "@/lib/admin/queries";
import { qrDataUrl } from "@/lib/admin/qr";
import { getRequestOrigin } from "@/lib/request";
import { getOrRotateStandQr } from "@/lib/stand/kiosk";
import StandQr from "@/components/stand/StandQr";

export const metadata: Metadata = {
  title: "QR del stand",
};

interface StandKioskPageProps {
  params: Promise<{ eventBadgeId: string }>;
}

export default async function StandKioskPage({ params }: StandKioskPageProps) {
  const { eventBadgeId } = await params;
  const { stand } = await requireStandForAdmin(eventBadgeId);

  const [detail, origin] = await Promise.all([
    getStandDetail(stand.id),
    getRequestOrigin(),
  ]);

  if (!detail) {
    notFound();
  }

  // Only the short-lived QR carries the secret. Names come from the same
  // stand detail query, already scoped by requireStandForAdmin.
  const payload = await getOrRotateStandQr(stand.id, stand.eventId);
  const qr = await qrDataUrl(`${origin}/s/${payload.token}`);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-celeste">
          QR del stand
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          {detail.badge.name}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {detail.event.name}
          {detail.room ? ` · ${detail.room}` : ""}
        </p>
      </header>

      <StandQr
        eventBadgeId={stand.id}
        label={detail.badge.name}
        initial={{
          token: payload.token,
          expiresAt: payload.expiresAt,
          startsAt: payload.startsAt,
          qr,
        }}
        note="Pide a los asistentes que escaneen esta pantalla. No imprimas ni reenvíes el código: cambia cada 60 s y tiene vigencia de 90 s."
      />
    </div>
  );
}
