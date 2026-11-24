import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidad",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[860px] px-4 py-10 sm:py-16">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-celeste">
            Lyfter Badges
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Privacidad</h1>
          <p className="mt-2 text-sm text-muted">
            Qué información guarda la app, para qué se usa y cómo pedir su
            eliminación.
          </p>
        </header>

        <div className="space-y-4">
          <section className="rounded-xl border border-stroke bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">Datos que guardamos</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Al registrarte se guardan tu nombre, tu correo y tu rol en el
              evento. También se registran tus escaneos, los badges obtenidos y
              la XP acumulada, junto con una cookie de sesión que mantiene tu
              acceso iniciado.
            </p>
          </section>

          <section className="rounded-xl border border-stroke bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">Para qué los usamos</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Esos datos permiten mostrar tu colección, tu nivel y tu posición en
              los rankings, y habilitan los paneles con los que organizadores y
              stands consultan métricas y auditoría del evento. La aplicación no
              incluye un flujo de venta de datos personales a terceros.
            </p>
          </section>

          <section className="rounded-xl border border-stroke bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">Conservación y eliminación</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              La información se conserva mientras tu cuenta y el evento estén
              activos. Para pedir la corrección o eliminación de tus datos,
              escribinos indicando el correo con el que te registraste.
            </p>
          </section>
        </div>

        <p className="mt-6 rounded-xl border border-peach/40 bg-peach/10 p-4 text-sm text-peach">
          Borrador informativo: revisalo con el equipo legal de Lyfter antes de
          publicarlo como política definitiva.
        </p>

        <p className="mt-6 text-sm text-muted">
          Para cualquier consulta sobre tus datos, usá{" "}
          <Link href="/contacto" className="text-celeste hover:underline">
            Contacto
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
