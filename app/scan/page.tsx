import type { Metadata } from "next";

import QrScanner from "@/components/scan/QrScanner";
import { getRecentRegistrations } from "@/lib/gamification/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Escanear un QR · Lyfter Badges",
};

export default async function ScanPage() {
  const session = await requireSession();

  const registrations = await getRecentRegistrations(session.user.id);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center px-4 py-10 sm:py-16">
        <header className="w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-celeste">
            Escanear
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Escanea un código QR</h1>
          <p className="mt-2 text-sm text-muted">
            Apunta la cámara al QR de bienvenida en la entrada y después a los
            QR de stands o charlas para recolectar insignias.
          </p>
        </header>

        <div className="mt-6 w-full max-w-md">
          {registrations.length === 0 ? (
            <p className="mb-4 rounded-lg border border-peach/40 bg-peach/10 px-4 py-3 text-sm text-peach/70">
              Todavía no hiciste check-in en ningún evento. Escanea primero el
              QR de bienvenida en la entrada.
            </p>
          ) : (
            <div className="mb-4 rounded-lg border border-sage/40 bg-sage/10 px-4 py-3 text-sm text-subtle">
              <p className="font-semibold text-sage">Check-in confirmado</p>
              <p className="mt-1">
                {registrations.map((item) => item.event.name).join(" · ")}
              </p>
            </div>
          )}

          <QrScanner />
        </div>

        <p className="mt-6 w-full max-w-md text-center text-xs text-muted">
          Cada QR también funciona como enlace directo. Si la cámara no se abre,
          comprueba que el sitio se sirva por HTTPS y que el acceso a la cámara
          esté permitido.
        </p>
      </div>
    </main>
  );
}
