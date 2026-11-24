// Pure collection and prize logic. No Prisma import: this module must stay
  // testable with plain data.

export interface CollectionProgress {
  /** Distinct badges collected in the event. */
  collected: number;
  /** Badges the event offers in total. */
  total: number;
  /** Badges still missing to complete the set. */
  missing: number;
  /** Whether the attendee collected every badge for the event. */
  complete: boolean;
  /** Progress across the event set, from 0 to 1 inclusive. */
  progress: number;
}

/**
 * Summarize how much of an event's badge set an attendee has collected.
 *
 * `total` is the number of badges enabled for the event; `collected` is the
 * count of distinct QR tokens the attendee actually scanned, so it is capped
 * at `total` to stay consistent when data drifts.
 */
export function collectionProgress(
  collected: number,
  total: number,
): CollectionProgress {
  const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
  const safeCollected =
    Number.isFinite(collected) && collected > 0 ? Math.floor(collected) : 0;
  const capped = safeTotal > 0 ? Math.min(safeCollected, safeTotal) : 0;
  const missing = Math.max(safeTotal - capped, 0);

  return {
    collected: capped,
    total: safeTotal,
    missing,
    complete: safeTotal > 0 && capped >= safeTotal,
    progress: safeTotal > 0 ? capped / safeTotal : 0,
  };
}

export interface PrizeReveal {
  /** Whether the prize details are visible to the attendee. */
  revealed: boolean;
  /** Whether the attendee earned the prize by completing the badge set. */
  earned: boolean;
  /** Whether the organizer announced the prize to every attendee. */
  announced: boolean;
  /** Badges still missing before the attendee earns the prize. */
  badgesToGo: number;
  /** Badges the prize requires. */
  required: number;
}

/**
 * Decide what an attendee is allowed to see about an event prize.
 *
 * A prize stays a secret until the attendee completes the badge set: that is
 * what makes the last badge worth scanning. The organizer can also announce
 * the prize to everyone, which reveals the details without granting it.
 *
 * `collected` and `required` always belong to the same event, so both numbers
 * must come from the same `eventId` cut.
 */
export function prizeReveal(input: {
  collected: number;
  required: number;
  announced: boolean;
}): PrizeReveal {
  const safeRequired =
    Number.isFinite(input.required) && input.required > 0
      ? Math.floor(input.required)
      : 0;
  const safeCollected =
    Number.isFinite(input.collected) && input.collected > 0
      ? Math.floor(input.collected)
      : 0;

  // A prize with no requirement is granted to everyone.
  const earned = safeRequired === 0 ? true : safeCollected >= safeRequired;

  return {
    revealed: earned || input.announced,
    earned,
    announced: input.announced,
    badgesToGo: Math.max(safeRequired - safeCollected, 0),
    required: safeRequired,
  };
}
