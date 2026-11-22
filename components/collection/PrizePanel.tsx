import Image from "next/image";

import { formatDate } from "@/lib/date";
import type { EventPrize } from "@/lib/gamification/queries";

interface PrizePanelProps {
  prize: EventPrize;
}

function pluralizeBadges(count: number) {
  return count === 1 ? "badge" : "badges";
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 4h12v5a6 6 0 0 1-12 0V4Z" />
      <path d="M6 6H4a2 2 0 0 0 2 4" />
      <path d="M18 6h2a2 2 0 0 1-2 4" />
      <path d="M12 15v6" />
      <path d="M9 21h6" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function PrizeProgress({
  percent,
  tone,
  label,
}: {
  percent: number;
  tone: "muted" | "info";
  label: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
      className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#39424f]"
    >
      <div
        className={`h-full rounded-full transition-all ${
          tone === "info" ? "bg-[#36bde9]" : "bg-[#89919e]"
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/**
 * Renders the event prize in one of three states: unlocked for the attendee,
 * announced by the organizer to everyone, or still a secret. While it is a
 * secret the prize details never reach the browser.
 */
export default function PrizePanel({ prize }: PrizePanelProps) {
  const { earned, announced, badgesToGo, required } = prize;
  const details = prize.details;

  const collected = Math.max(required - badgesToGo, 0);
  const percent =
    required > 0 ? Math.min(Math.round((collected / required) * 100), 100) : 100;

  if (!details) {
    return (
      <div className="mt-5 rounded-lg border border-[#39424f] bg-[#1f252d] p-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#89919e]">
          <LockIcon className="h-4 w-4" />
          Prize locked
        </p>
        <p className="mt-3 text-sm font-semibold text-[#89919e]">
          Hidden until you complete the badge set.
        </p>
        <p className="mt-1 text-sm text-[#9ca3af]">
          Collect {badgesToGo} more {pluralizeBadges(badgesToGo)} to reveal it.
        </p>

        <PrizeProgress
          percent={percent}
          tone="muted"
          label="Progress toward the prize"
        />
      </div>
    );
  }

  if (earned) {
    return (
      <div className="mt-5 rounded-lg border border-[#a8d889]/50 bg-[#a8d889]/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#a8d889]">
              <TrophyIcon className="h-4 w-4" />
              Prize unlocked
            </p>
            <p className="mt-2 text-lg font-bold text-[#f1f1ed]">
              {details.name}
            </p>
            {details.description ? (
              <p className="mt-1 text-sm text-[#d7dce3]">{details.description}</p>
            ) : null}
          </div>

          {details.imageUrl ? (
            <Image
              src={details.imageUrl}
              alt={details.name}
              width={96}
              height={96}
              unoptimized
              className="h-24 w-24 shrink-0 rounded-lg object-cover"
            />
          ) : null}
        </div>

        <p className="mt-4 text-sm font-semibold text-[#a8d889]">
          You completed the badge set. This prize is yours.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-lg border border-[#36bde9]/40 bg-[#36bde9]/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
            <TrophyIcon className="h-4 w-4" />
            Prize announced
          </p>
          <p className="mt-2 text-lg font-bold text-[#f1f1ed]">
            {details.name}
          </p>
          {details.description ? (
            <p className="mt-1 text-sm text-[#d7dce3]">{details.description}</p>
          ) : null}
          {announced && details.revealedAt ? (
            <p className="mt-1 text-xs text-[#9ca3af]">
              Announced on {formatDate(details.revealedAt)}
            </p>
          ) : null}
        </div>

        {details.imageUrl ? (
          <Image
            src={details.imageUrl}
            alt={details.name}
            width={96}
            height={96}
            unoptimized
            className="h-24 w-24 shrink-0 rounded-lg object-cover"
          />
        ) : null}
      </div>

      <p className="mt-4 text-sm text-[#d7dce3]">
        {badgesToGo} more {pluralizeBadges(badgesToGo)} to earn it.
      </p>

      <PrizeProgress
        percent={percent}
        tone="info"
        label="Progress toward the prize"
      />
    </div>
  );
}
