import type { LevelProgress } from "@/lib/gamification/levels";

interface LevelCardProps {
  level: LevelProgress;
  totalXp: number;
  globalPosition: number | null;
  totalPlayers: number;
}

export default function LevelCard({
  level,
  totalXp,
  globalPosition,
  totalPlayers,
}: LevelCardProps) {
  const percent = Math.round(level.progress * 100);

  return (
    <section className="rounded-xl border border-[#39424f] bg-[#252c35] p-5 shadow-2xl shadow-black/30 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 sm:gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
            Level {level.level}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#f1f1ed] sm:text-3xl">
            {level.name}
          </h2>
        </div>

        <div className="text-right">
          <p className="text-3xl font-black text-[#a8d889]">{totalXp}</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">
            Total XP
          </p>
          {globalPosition !== null ? (
            <p className="mt-2 text-xs font-semibold text-[#7fd8f5]">
              #{globalPosition} of {totalPlayers} globally
            </p>
          ) : null}
        </div>
      </div>

      {level.nextLevelXp !== null ? (
        <div className="mt-6">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label={`Progress to level ${level.level + 1}`}
            className="h-2.5 w-full overflow-hidden rounded-full bg-[#39424f]"
          >
            <div
              className="h-full rounded-full bg-[#a8d889] transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-[#9ca3af]">
            {level.xpToNextLevel} XP to reach level {level.level + 1}
          </p>
        </div>
      ) : (
        <p className="mt-6 text-sm font-semibold text-[#a8d889]">
          You reached the top level. Keep collecting for fun.
        </p>
      )}
    </section>
  );
}
