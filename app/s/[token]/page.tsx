import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import ScanClaim from "@/components/scan/ScanClaim";
import {
  getQrTokenForClaim,
  getRegistrationForClaim,
} from "@/lib/gamification/queries";
import { resolveScanTarget } from "@/lib/scan/target";
import { getRequestOrigin } from "@/lib/request";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Collect your badge · Lyfter Badges",
};

interface ScanPageProps {
  params: Promise<{ token: string }>;
}

function BlockedScan({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#171b21] px-4 py-10 sm:py-16">
      <div className="w-full max-w-md rounded-xl border border-[#39424f] bg-[#252c35] p-6 text-center shadow-2xl shadow-black/30 sm:p-8">
        <h1 className="text-lg font-bold text-[#f1f1ed]">{message}</h1>
        <Link
          href="/scan"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-[#394351] px-6 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
        >
          Scan a QR code
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
      <BlockedScan message="This QR code is not valid or is no longer active." />
    );
  }

  const isWelcome = qr.kind === "WELCOME";
  const badge = qr.eventBadge?.badge ?? null;

  let isRegistered = false;

  if (!isWelcome) {
    const registration = await getRegistrationForClaim(
      session.user.id,
      qr.eventId,
    );
    isRegistered = registration !== null;
  }

  const target = resolveScanTarget(
    {
      token: qr.token,
      kind: qr.kind,
      active: qr.active,
      startsAt: qr.startsAt,
      expiresAt: qr.expiresAt,
      badgeStartsAt: qr.eventBadge?.startsAt ?? null,
      hasBadge: badge !== null,
      eventName: qr.event.name,
    },
    isRegistered,
  );

  const blockedMessage =
    target.status === "invalid"
      ? "This QR code is not valid or is no longer active."
      : target.status === "not_started"
        ? "This QR code or badge is not available yet."
        : target.status === "expired"
          ? "This QR code has expired."
          : target.status === "needs_check_in"
            ? "Scan the welcome QR at the entrance before collecting badges."
            : null;

  if (blockedMessage) {
    return <BlockedScan message={blockedMessage} />;
  }

  const origin = await getRequestOrigin();

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#171b21] px-4 py-10 sm:py-16">
      <div className="w-full max-w-md rounded-xl border border-[#39424f] bg-[#252c35] p-6 text-center shadow-2xl shadow-black/30 sm:p-8">
        {isWelcome ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#36bde9]">
              Check in
            </p>
            <h1 className="mt-3 text-2xl font-bold text-[#f1f1ed]">
              {qr.event.name}
            </h1>
            <p className="mt-3 text-sm text-[#9ca3af]">
              Welcome! Claim your check-in below.
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
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-[#a8d889] text-4xl font-black text-[#263021]"
              >
                {badge.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="mt-5 text-2xl font-bold text-[#f1f1ed]">
              {badge.name}
            </h1>
            {badge.description ? (
              <p className="mt-2 text-sm text-[#d7dce3]">{badge.description}</p>
            ) : null}
            <p className="mt-3 text-sm font-semibold text-[#a8d889]">
              +{badge.xpValue} XP
            </p>
            {qr.eventBadge?.room ? (
              <p className="mt-1 text-sm text-[#9ca3af]">
                {qr.eventBadge.room}
              </p>
            ) : null}
            <p className="mt-4 text-sm text-[#9ca3af]">{qr.event.name}</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-bold text-[#f1f1ed]">
              This QR code is not configured correctly.
            </h1>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg border border-[#394351] px-6 py-3 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
            >
              Go to the homepage
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
