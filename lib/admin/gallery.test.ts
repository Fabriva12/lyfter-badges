import { describe, expect, it } from "vitest";

import { moveItem, moveToFront } from "./gallery";

describe("moveItem", () => {
  const items = ["a", "b", "c", "d"];

  it("moves an item down", () => {
    expect(moveItem(items, 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("moves an item up", () => {
    expect(moveItem(items, 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("returns a copy when the move is a no-op", () => {
    const result = moveItem(items, 2, 2);

    expect(result).toEqual(items);
    expect(result).not.toBe(items);
  });

  it("ignores out-of-range indexes", () => {
    expect(moveItem(items, -1, 2)).toEqual(items);
    expect(moveItem(items, 2, 9)).toEqual(items);
  });

  it("does not mutate the input", () => {
    moveItem(items, 0, 3);

    expect(items).toEqual(["a", "b", "c", "d"]);
  });
});

describe("moveToFront", () => {
  it("promotes the selected item to the cover position", () => {
    expect(moveToFront(["a", "b", "c"], 2)).toEqual(["c", "a", "b"]);
  });

  it("keeps the order when the item is already first", () => {
    expect(moveToFront(["a", "b"], 0)).toEqual(["a", "b"]);
  });
});
