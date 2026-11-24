import { describe, expect, it } from "vitest";

import {
  MAX_SCAN_ATTEMPTS,
  PENDING_SCANS_STORAGE_KEY,
  ScanTimeoutError,
  isRetryableScanError,
  nextRetryDelay,
  readPendingScans,
  removePendingScan,
  shouldRetry,
  upsertPendingScan,
  withTimeout,
  writePendingScans,
} from "./pending";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

describe("nextRetryDelay", () => {
  it("backs off exponentially from the base delay", () => {
    const noJitter = () => 0.5;

    expect(nextRetryDelay(0, noJitter)).toBe(800);
    expect(nextRetryDelay(1, noJitter)).toBe(1600);
    expect(nextRetryDelay(2, noJitter)).toBe(3200);
    expect(nextRetryDelay(3, noJitter)).toBe(6400);
  });

  it("caps the delay and keeps jitter inside 20 percent", () => {
    expect(nextRetryDelay(10, () => 0.5)).toBe(10_000);

    const low = nextRetryDelay(0, () => 0);
    const high = nextRetryDelay(0, () => 0.999);

    expect(low).toBe(640);
    expect(high).toBeLessThanOrEqual(960);
    expect(high).toBeGreaterThan(low);
  });

  it("treats invalid attempts as the first retry", () => {
    expect(nextRetryDelay(Number.NaN, () => 0.5)).toBe(800);
    expect(nextRetryDelay(-3, () => 0.5)).toBe(800);
  });
});

describe("shouldRetry", () => {
  it("stops after the maximum number of attempts", () => {
    expect(shouldRetry(0)).toBe(true);
    expect(shouldRetry(MAX_SCAN_ATTEMPTS - 1)).toBe(true);
    expect(shouldRetry(MAX_SCAN_ATTEMPTS)).toBe(false);
  });
});

describe("isRetryableScanError", () => {
  it("retries network failures and timeouts", () => {
    expect(isRetryableScanError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isRetryableScanError(new Error("Load failed"))).toBe(true);
    expect(isRetryableScanError(new ScanTimeoutError())).toBe(true);
  });

  it("does not retry unknown application errors", () => {
    expect(isRetryableScanError(new Error("Invalid QR"))).toBe(false);
    expect(isRetryableScanError("something")).toBe(false);
  });
});

describe("withTimeout", () => {
  it("resolves before the timeout", async () => {
    await expect(withTimeout(Promise.resolve(42), 1000)).resolves.toBe(42);
  });

  it("rejects with a retryable timeout", async () => {
    const pending = new Promise<never>(() => {});
    await expect(withTimeout(pending, 10)).rejects.toBeInstanceOf(
      ScanTimeoutError,
    );
  });
});

describe("pending scan storage", () => {
  it("round-trips a queue", () => {
    const storage = createMemoryStorage();
    const scan = {
      token: "demo-keynote",
      userId: "user-1",
      startedAt: 1,
      attempt: 0,
    };

    expect(upsertPendingScan(scan, storage)).toEqual([scan]);
    expect(readPendingScans(storage)).toEqual([scan]);
    expect(storage.getItem(PENDING_SCANS_STORAGE_KEY)).toContain(
      "demo-keynote",
    );
  });

  it("keeps one entry per user and token and updates the attempt", () => {
    const storage = createMemoryStorage();

    upsertPendingScan(
      { token: "a", userId: "user-1", startedAt: 1, attempt: 0 },
      storage,
    );
    upsertPendingScan(
      { token: "b", userId: "user-1", startedAt: 2, attempt: 0 },
      storage,
    );
    upsertPendingScan(
      { token: "a", userId: "user-1", startedAt: 1, attempt: 3 },
      storage,
    );

    expect(readPendingScans(storage)).toEqual([
      { token: "a", userId: "user-1", startedAt: 1, attempt: 3 },
      { token: "b", userId: "user-1", startedAt: 2, attempt: 0 },
    ]);
  });

  it("keeps separate entries for different users on the same device", () => {
    const storage = createMemoryStorage();

    upsertPendingScan(
      { token: "a", userId: "user-1", startedAt: 1, attempt: 0 },
      storage,
    );
    upsertPendingScan(
      { token: "a", userId: "user-2", startedAt: 2, attempt: 0 },
      storage,
    );

    expect(readPendingScans(storage)).toEqual([
      { token: "a", userId: "user-1", startedAt: 1, attempt: 0 },
      { token: "a", userId: "user-2", startedAt: 2, attempt: 0 },
    ]);

    expect(
      removePendingScan({ token: "a", userId: "user-1" }, storage),
    ).toEqual([{ token: "a", userId: "user-2", startedAt: 2, attempt: 0 }]);
  });

  it("removes a confirmed token", () => {
    const storage = createMemoryStorage();

    writePendingScans(
      [
        { token: "a", userId: "user-1", startedAt: 1, attempt: 0 },
        { token: "b", userId: "user-1", startedAt: 2, attempt: 0 },
      ],
      storage,
    );

    expect(
      removePendingScan({ token: "a", userId: "user-1" }, storage),
    ).toEqual([{ token: "b", userId: "user-1", startedAt: 2, attempt: 0 }]);
  });

  it("ignores corrupt or malformed storage", () => {
    const storage = createMemoryStorage();

    storage.setItem(PENDING_SCANS_STORAGE_KEY, "{not json");
    expect(readPendingScans(storage)).toEqual([]);

    storage.setItem(PENDING_SCANS_STORAGE_KEY, JSON.stringify([{ token: 1 }]));
    expect(readPendingScans(storage)).toEqual([]);

    storage.setItem(
      PENDING_SCANS_STORAGE_KEY,
      JSON.stringify({ token: "a", userId: "user-1" }),
    );
    expect(readPendingScans(storage)).toEqual([]);

    // Entries persisted before scans were namespaced by user are discarded.
    storage.setItem(
      PENDING_SCANS_STORAGE_KEY,
      JSON.stringify([{ token: "a", startedAt: 1, attempt: 0 }]),
    );
    expect(readPendingScans(storage)).toEqual([]);
  });

  it("does not throw without a storage", () => {
    expect(readPendingScans(null)).toEqual([]);
    expect(() =>
      writePendingScans(
        [
          {
            token: "a",
            userId: "user-1",
            startedAt: 1,
            attempt: 0,
          },
        ],
        null,
      ),
    ).not.toThrow();
  });
});
