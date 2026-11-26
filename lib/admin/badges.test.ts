import { describe, expect, it } from "vitest";

import { canRemoveEventBadge, isCatalogBadgeShared } from "./badges";

describe("isCatalogBadgeShared", () => {
  it("allows renaming a catalog name used by at most one event", () => {
    expect(isCatalogBadgeShared(0)).toBe(false);
    expect(isCatalogBadgeShared(1)).toBe(false);
  });

  it("blocks renaming a catalog name used by two or more events", () => {
    expect(isCatalogBadgeShared(2)).toBe(true);
    expect(isCatalogBadgeShared(12)).toBe(true);
  });
});

describe("canRemoveEventBadge", () => {
  it("allows detaching a badge with no collected scans", () => {
    expect(canRemoveEventBadge(0)).toBe(true);
  });

  it("blocks detaching when scans exist", () => {
    expect(canRemoveEventBadge(1)).toBe(false);
    expect(canRemoveEventBadge(50)).toBe(false);
  });
});
