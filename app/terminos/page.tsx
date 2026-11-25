import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[860px] px-4 py-10 sm:py-16">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-celeste">
            Lyfter Badges
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Términos de uso
          </h1>
          <p className="mt-2 text-sm text-muted">
            Cómo funciona Lyfter Badges y qué se espera de quienes lo usan.
          </p>
        </header>

        <div className="space-y-4">
          <section className="rounded-xl border border-stroke bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">El servicio</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Lyfter Badges es una plataforma de gamificación para eventos. Los
              asistentes se registran, escanean los códigos de las charlas y los
              stands, y reciben badges y XP. Esa actividad define su nivel global
              y los rankings, y al completar los badges de un evento se desbloquea
              el premio correspondiente.
            </p>
          </section>

          <section className="rounded-xl border border-stroke bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">Cuentas y códigos QR</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Cada persona usa su propia cuenta. Los códigos de stand están
              pensados para el personal autorizado del evento y no deben
              compartirse públicamente: un escaneo queda registrado con su fecha
              y su evento, y no puede duplicarse para el mismo badge.
            </p>
          </section>

          <section className="rounded-xl border border-stroke bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">Cambios y disponibilidad</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Los organizadores pueden ajustar eventos, badges, premios y reglas;
              esos cambios se reflejan en la aplicación. El acceso puede
              interrumpirse temporalmente por mantenimiento o por problemas con
              servicios externos.
            </p>
          </section>
        </div>

        <p className="mt-6 rounded-xl border border-peach/40 bg-peach/10 p-4 text-sm text-peach">
          Borrador informativo: revisalo con el equipo legal de Lyfter antes de
          publicarlo como documento vinculante.
        </p>

        <p className="mt-6 text-sm text-muted">
          ¿Tenés una consulta? Escribinos desde{" "}
          <Link href="/contacto" className="text-celeste hover:underline">
            Contacto
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
