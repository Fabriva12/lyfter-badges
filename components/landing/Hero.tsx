import AppMockup from "./AppMockup";

export default function Hero() {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-10">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Text */}
        <div>
          <span className="inline-flex rounded-full bg-[#ffc875] px-4 py-1.5 text-xs font-bold tracking-wide text-[#332b1d]">
            GAMIFICÁ TU EVENTO
          </span>

          <h1 className="mt-6 max-w-2xl text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            Escaneá, coleccioná badges y subí de nivel en cada charla
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-[#9ca3af] sm:text-lg sm:leading-8">
            Convertí la asistencia a charlas y stands en una experiencia de
            juego. Ganá XP, competí en el leaderboard y reclamá tu premio.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <a
              href="/events"
              className="rounded-lg bg-[#a8d889] px-7 py-4 text-center text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a]"
            >
              Ver Eventos →
            </a>

            <a
              href="#como-funciona"
              className="rounded-lg border border-[#394351] px-7 py-4 text-center text-sm font-semibold text-gray-200 transition hover:bg-[#272d36]"
            >
              Cómo funciona
            </a>
          </div>
        </div>

        {/* Mockup */}
        <div className="relative flex justify-center">
          <div
            aria-hidden="true"
            className="absolute inset-x-10 bottom-8 top-12 rounded-full bg-[#36bde9]/10 blur-3xl"
          />
          <AppMockup />
        </div>
      </div>
    </section>
  );
}
