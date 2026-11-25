import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import ScanClaim from "@/components/scan/ScanClaim";
import {
  getQrTokenForClaim,
  getRegistrationForClaim,
  getScanForClaim,
} from "@/lib/gamification/queries";
import { getRequestOrigin } from "@/lib/request";
import { EVENT_WINDOW_MESSAGES } from "@/lib/scan/event-window";
import { resolveScanTarget, toScanQr, type ScanTarget } from "@/lib/scan/target";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Recolecta tu insignia · Lyfter Badges",
};

interface ScanPageProps {
  params: Promise<{ token: string }>;
}

const BLOCKED_MESSAGES: Partial<Record<ScanTarget["status"], string>> = {
  invalid: "Este código QR no es válido o ya no está activo.",
  not_started: "Este código QR o esta insignia todavía no están disponibles.",
  expired: "Este código QR venció.",
  needs_check_in: "Escanea el QR de bienvenida en la entrada antes de recolectar insignias.",
  ...EVENT_WINDOW_MESSAGES,
};

function BlockedScan({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:py-16">
      <div className="w-full max-w-md rounded-xl border border-stroke bg-surface p-6 text-center shadow-2xl shadow-black/30 sm:p-8">
        <h1 className="text-lg font-bold text-foreground">{message}</h1>
        <Link
          href="/scan"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-stroke px-6 text-sm font-semibold text-subtle transition hover:bg-ink"
        >
          Escanea un código QR
        </Link>
      </div>
    </main>
  );
}

export default async function ScanPage({ params }: ScanPageProps) {
  const { token } = await params;

  const session = await getSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/s/${token}`)}`);
  }

  const qr = await getQrTokenForClaim(token);

  if (!qr || !qr.active) {
    return (
      <BlockedScan message="Este código QR no es válido o ya no está activo." />
    );
  }

  const isWelcome = qr.kind === "WELCOME";
  const badge = qr.eventBadge?.badge ?? null;

  const registration = await getRegistrationForClaim(
    session.user.id,
    qr.eventId,
  );
  const isRegistered = registration !== null;

  const existingScan =
    !isWelcome && qr.eventBadgeId
      ? await getScanForClaim(session.user.id, qr.eventBadgeId)
      : null;
  const hasExistingClaim = isWelcome ? isRegistered : existingScan !== null;

  const target = resolveScanTarget(
    toScanQr(qr),
    isRegistered,
    new Date(),
    hasExistingClaim,
  );

  const blockedMessage = BLOCKED_MESSAGES[target.status] ?? null;

  if (blockedMessage) {
    return <BlockedScan message={blockedMessage} />;
  }

  const origin = await getRequestOrigin();

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-10 sm:py-16">
      <div className="w-full max-w-md rounded-xl border border-stroke bg-surface p-6 text-center shadow-2xl shadow-black/30 sm:p-8">
        {isWelcome ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-widest text-celeste">
              Check-in
            </p>
            <h1 className="mt-3 text-2xl font-bold text-foreground">
              {qr.event.name}
            </h1>
            <p className="mt-3 text-sm text-muted">
              ¡Bienvenido! Confirma tu check-in abajo.
            </p>
          </>
        ) : badge ? (
          <>
            {badge.imageUrl ? (
              <Image
                src={badge.imageUrl}
                alt={badge.name}
                width={96}
                height={96}
                unoptimized
                className="mx-auto rounded-2xl object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-sage text-4xl font-black text-[#263021]"
              >
                {badge.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="mt-5 text-2xl font-bold text-foreground">
              {badge.name}
            </h1>
            {badge.description ? (
              <p className="mt-2 text-sm text-subtle">{badge.description}</p>
            ) : null}
            <p className="mt-3 text-sm font-semibold text-sage">
              +{badge.xpValue} XP
            </p>
            {qr.eventBadge?.room ? (
              <p className="mt-1 text-sm text-muted">
                {qr.eventBadge.room}
              </p>
            ) : null}
            <p className="mt-4 text-sm text-muted">{qr.event.name}</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-bold text-foreground">
              Este código QR no está configurado correctamente.
            </h1>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg border border-stroke px-6 py-3 text-sm font-semibold text-subtle transition hover:bg-ink"
            >
              Ir al inicio
            </Link>
          </>
        )}
      </div>

      {target.status === "welcome" || target.status === "ready" ? (
        <ScanClaim
          key={token}
          token={token}
          userId={session.user.id}
          origin={origin}
        />
      ) : null}
    </main>
  );
}
