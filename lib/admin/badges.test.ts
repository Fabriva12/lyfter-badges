import { describe, expect, it } from "vitest";

import { canRemoveEventBadge, isCatalogBadgeShared } from "./badges";

describe("isCatalogBadgeShared", () => {
  it("treats a badge used by one event as editable", () => {
    expect(isCatalogBadgeShared(0)).toBe(false);
    expect(isCatalogBadgeShared(1)).toBe(false);
  });

  it("treats a badge used by two or more events as shared", () => {
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
