import { BadgeIcon } from "@/lib/badges/icons";

const badges = [
  { icon: "mic", name: "Keynote", xp: 50, collected: true },
  { icon: "code", name: "RSC", xp: 60, collected: true },
  { icon: "database", name: "Supabase", xp: 40, collected: true },
  { icon: "shield", name: "Auth", xp: 70, collected: false },
  { icon: "star", name: "Speakers", xp: 30, collected: false },
  { icon: "ticket", name: "Party", xp: 20, collected: false },
];

function ScanIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
    </svg>
  );
}

export default function AppMockup() {
  return (
    <figure className="relative w-full max-w-[300px] sm:max-w-[320px]">
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[3rem] bg-[#a8d889]/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="relative rounded-[2.2rem] border border-[#3a4350] bg-[#0f1317] p-2 shadow-2xl shadow-black/60"
      >
        <div className="overflow-hidden rounded-[1.7rem] bg-[#171b21]">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-semibold text-[#7d8794]">
            <span>9:41</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a8d889]" />
              En vivo
            </span>
          </div>

          <div className="px-4 pb-4 pt-3">
            {/* App header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#36bde9]">
                  Lyfter Demo Costa Rica 2026
                </p>
                <p className="mt-1 text-sm font-bold text-[#f1f1ed]">
                  Mi colección
                </p>
              </div>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#a8d889] text-xs font-black text-[#243020]">
                L
              </div>
            </div>

            {/* Level */}
            <div className="mt-3 rounded-xl border border-[#39424f] bg-[#252c35] p-3.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-[#36bde9]">
                    Nivel 4
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[#f1f1ed]">
                    Builder
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-black leading-none text-[#a8d889]">
                    340
                  </p>
                  <p className="text-[8px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                    XP total
                  </p>
                </div>
              </div>

              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={68}
                aria-label="Progreso al nivel 5"
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#39424f]"
              >
                <div className="h-full w-[68%] rounded-full bg-[#a8d889]" />
              </div>

              <p className="mt-1.5 text-[9px] text-[#9ca3af]">
                160 XP para el nivel 5
              </p>
            </div>

            {/* Collection */}
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-[#f1f1ed]">Badges</p>
              <p className="text-[9px] font-semibold text-[#36bde9]">3 de 6</p>
            </div>

            <ul className="mt-2 grid grid-cols-3 gap-2">
              {badges.map((badge) => (
                <li
                  key={badge.name}
                  className={`rounded-lg border p-2 ${
                    badge.collected
                      ? "border-[#a8d889]/40 bg-[#a8d889]/10"
                      : "border-[#39424f] bg-[#1f252d]"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${
                      badge.collected
                        ? "bg-[#a8d889] text-[#263021]"
                        : "bg-[#39424f] text-[#7d8794]"
                    }`}
                  >
                    <BadgeIcon name={badge.icon} className="h-4 w-4" />
                  </div>
                  <p
                    className={`mt-1.5 truncate text-[8px] font-semibold ${
                      badge.collected ? "text-[#f1f1ed]" : "text-[#9ca3af]"
                    }`}
                  >
                    {badge.name}
                  </p>
                  <p className="truncate text-[7px] text-[#9ca3af]">
                    {badge.collected ? `+${badge.xp} XP` : "Bloqueado"}
                  </p>
                </li>
              ))}
            </ul>

            {/* Leaderboard */}
            <div className="mt-3 flex items-center justify-between rounded-lg border border-[#39424f] bg-[#1f252d] px-3 py-2">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                Leaderboard
              </span>
              <span className="text-[10px] font-bold text-[#f1f1ed]">
                #7 <span className="font-normal text-[#9ca3af]">de 42</span>
              </span>
            </div>

            {/* CTA */}
            <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[#a8d889] px-3 py-2.5 text-[10px] font-bold text-[#243020]">
              <ScanIcon />
              Escanear QR
            </div>
          </div>
        </div>
      </div>

      <figcaption className="sr-only">
        Vista previa de la app: nivel, XP, colección de badges y leaderboard del
        evento.
      </figcaption>
    </figure>
  );
}
