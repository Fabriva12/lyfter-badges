// Pure rotation timing for the stand QR kiosk. No database, no clock reads:
// callers pass `now` so the rule stays testable.
export const ROTATION_TTL_MS = 90_000;
export const ROTATION_POLL_MS = 60_000;
export const ROTATION_REFRESH_LEAD_MS = 30_000;

export function buildRotationWindow(now: Date): {
  startsAt: Date;
  expiresAt: Date;
} {
  return {
    startsAt: new Date(now.getTime()),
    expiresAt: new Date(now.getTime() + ROTATION_TTL_MS),
  };
}

/** True when forced, or when a token is missing, expired, or about to expire. */
export function needsRotation(
  expiresAt: Date | null,
  now: Date,
  force = false,
): boolean {
  if (force || !expiresAt) {
    return true;
  }

  return expiresAt.getTime() - now.getTime() <= ROTATION_REFRESH_LEAD_MS;
}
