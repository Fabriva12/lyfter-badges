export const PENDING_SCANS_STORAGE_KEY = "lyfter.pending-scans";

export interface PendingScan {
  token: string;
  /** Owner of the scan: a shared device must not replay another user's badge. */
  userId: string;
  /** When the attendee first tried to claim this token. */
  startedAt: number;
  /** How many delivery attempts have already failed. */
  attempt: number;
}

export const MAX_SCAN_ATTEMPTS = 5;
export const SCAN_REQUEST_TIMEOUT_MS = 20_000;

const BASE_RETRY_DELAY_MS = 800;
const MAX_RETRY_DELAY_MS = 10_000;

/**
 * Exponential backoff with jitter. `attempt` is the number of failures so far,
 * so the retry delays are ~1.6s, 3.2s, 6.4s, then the 10s cap.
 */
export function nextRetryDelay(
  attempt: number,
  random: () => number = Math.random,
): number {
  const safeAttempt = Number.isFinite(attempt) ? Math.max(0, attempt) : 0;
  const exponential = Math.min(
    MAX_RETRY_DELAY_MS,
    BASE_RETRY_DELAY_MS * 2 ** safeAttempt,
  );
  const jitter = 0.8 + random() * 0.4;
  return Math.round(exponential * jitter);
}

export function shouldRetry(attempt: number): boolean {
  return attempt < MAX_SCAN_ATTEMPTS;
}

export class ScanTimeoutError extends Error {
  constructor() {
    super("The scan request timed out.");
    this.name = "ScanTimeoutError";
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = SCAN_REQUEST_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ScanTimeoutError()), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

/**
 * The server action rejects when the request never reached the server
 * (offline, DNS, TLS, timeout). Those are always safe to retry because the
 * claim is idempotent. Business errors arrive as a resolved `ScanFormState`
 * with `retryable: false`, never as a rejection.
 */
export function isRetryableScanError(error: unknown): boolean {
  if (error instanceof ScanTimeoutError) {
    return true;
  }

  if (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.onLine === false
  ) {
    return true;
  }

  if (error instanceof TypeError) {
    return true;
  }

  const message = error instanceof Error ? error.message : "";
  return /failed to fetch|fetch failed|networkerror|network error|load failed/i.test(
    message,
  );
}

function isPendingScan(value: unknown): value is PendingScan {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<PendingScan>;
  return (
    typeof candidate.token === "string" &&
    candidate.token.length > 0 &&
    typeof candidate.userId === "string" &&
    candidate.userId.length > 0 &&
    typeof candidate.startedAt === "number" &&
    Number.isFinite(candidate.startedAt) &&
    typeof candidate.attempt === "number" &&
    Number.isFinite(candidate.attempt) &&
    candidate.attempt >= 0
  );
}

function resolveStorage(storage?: Storage | null): Storage | null {
  if (storage) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    // Safari private mode and hardened browsers can throw on access.
    return null;
  }
}

export function readPendingScans(storage?: Storage | null): PendingScan[] {
  const store = resolveStorage(storage);

  if (!store) {
    return [];
  }

  try {
    const raw = store.getItem(PENDING_SCANS_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPendingScan) : [];
  } catch {
    return [];
  }
}

export function writePendingScans(
  scans: PendingScan[],
  storage?: Storage | null,
): void {
  const store = resolveStorage(storage);

  if (!store) {
    return;
  }

  try {
    if (scans.length === 0) {
      store.removeItem(PENDING_SCANS_STORAGE_KEY);
    } else {
      store.setItem(PENDING_SCANS_STORAGE_KEY, JSON.stringify(scans));
    }
  } catch {
    // Storage can be full or disabled; the in-memory retry still works.
  }
}

function isSameScan(
  a: Pick<PendingScan, "token" | "userId">,
  b: Pick<PendingScan, "token" | "userId">,
): boolean {
  return a.token === b.token && a.userId === b.userId;
}

/** Adds a token or updates its attempt counter; one entry per user and token. */
export function upsertPendingScan(
  scan: PendingScan,
  storage?: Storage | null,
): PendingScan[] {
  const scans = readPendingScans(storage);
  const exists = scans.some((entry) => isSameScan(entry, scan));
  const next = exists
    ? scans.map((entry) =>
        isSameScan(entry, scan) ? { ...entry, ...scan } : entry,
      )
    : [...scans, scan];

  writePendingScans(next, storage);
  return next;
}

export function removePendingScan(
  scan: Pick<PendingScan, "token" | "userId">,
  storage?: Storage | null,
): PendingScan[] {
  const next = readPendingScans(storage).filter(
    (entry) => !isSameScan(entry, scan),
  );
  writePendingScans(next, storage);
  return next;
}
