import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contacto",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[860px] px-4 py-10 sm:py-16">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-celeste">
            Lyfter Badges
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Contacto</h1>
          <p className="mt-2 text-sm text-muted">
            ¿Necesitás ayuda con tu cuenta, un evento o un badge? Escribinos.
          </p>
        </header>

        <section className="rounded-xl border border-stroke bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-bold">Escribinos</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Contanos qué pasó y, si se trata de un evento, incluí su nombre y el
            correo con el que te registraste. Eso nos permite responder más
            rápido.
          </p>
          <a
            href="mailto:contacto@lyfter.com"
            className="mt-4 inline-block rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-[#243020] transition hover:bg-sage-soft"
          >
            contacto@lyfter.com
          </a>
        </section>

        <p className="mt-6 rounded-xl border border-peach/40 bg-peach/10 p-4 text-sm text-peach">
          La dirección de correo es un placeholder: reemplazala por el canal
          real de soporte antes de publicar esta página.
        </p>

        <p className="mt-6 text-sm text-muted">
          También podés leer nuestros{" "}
          <Link href="/terminos" className="text-celeste hover:underline">
            términos de uso
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" className="text-celeste hover:underline">
            política de privacidad
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
