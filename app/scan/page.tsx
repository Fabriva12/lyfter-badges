import type { Metadata } from "next";

import QrScanner from "@/components/scan/QrScanner";
import { getRecentRegistrations } from "@/lib/gamification/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Scan a QR · Lyfter Badges",
};

export default async function ScanPage() {
  const session = await requireSession();

  const registrations = await getRecentRegistrations(session.user.id);

  return (
    <main className="min-h-screen bg-[#171b21] text-[#f1f1ed]">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center px-4 py-10 sm:py-16">
        <header className="w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
            Scan
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Scan a QR code</h1>
          <p className="mt-2 text-sm text-[#9ca3af]">
            Point your camera at the welcome QR at the entrance, then at the
            stand or talk QRs to collect badges.
          </p>
        </header>

        <div className="mt-6 w-full max-w-md">
          {registrations.length === 0 ? (
            <p className="mb-4 rounded-lg border border-[#ffc875]/40 bg-[#ffc875]/10 px-4 py-3 text-sm text-[#ffdca8]">
              You are not checked in to any event yet. Scan the welcome QR at the
              entrance first.
            </p>
          ) : (
            <div className="mb-4 rounded-lg border border-[#a8d889]/40 bg-[#a8d889]/10 px-4 py-3 text-sm text-[#d7dce3]">
              <p className="font-semibold text-[#a8d889]">Checked in</p>
              <p className="mt-1">
                {registrations.map((item) => item.event.name).join(" · ")}
              </p>
            </div>
          )}

          <QrScanner />
        </div>

        <p className="mt-6 w-full max-w-md text-center text-xs text-[#6b7280]">
          Every QR also works as a direct link. If the camera does not open,
          check that the site is served over HTTPS and that camera access is
          allowed.
        </p>
      </div>
    </main>
  );
}
