import { describe, expect, it } from "vitest";

import { collectionProgress, prizeReveal } from "./collection";

describe("collectionProgress", () => {
  it("reports an empty collection", () => {
    const result = collectionProgress(0, 4);

    expect(result.collected).toBe(0);
    expect(result.total).toBe(4);
    expect(result.missing).toBe(4);
    expect(result.complete).toBe(false);
    expect(result.progress).toBe(0);
  });

  it("reports partial progress", () => {
    const result = collectionProgress(2, 4);

    expect(result.collected).toBe(2);
    expect(result.missing).toBe(2);
    expect(result.complete).toBe(false);
    expect(result.progress).toBe(0.5);
  });

  it("reports a complete collection", () => {
    const result = collectionProgress(4, 4);

    expect(result.collected).toBe(4);
    expect(result.missing).toBe(0);
    expect(result.complete).toBe(true);
    expect(result.progress).toBe(1);
  });

  it("caps collected at total when data drifts", () => {
    const result = collectionProgress(9, 4);

    expect(result.collected).toBe(4);
    expect(result.missing).toBe(0);
    expect(result.complete).toBe(true);
  });

  it("treats an event with no badges as incomplete", () => {
    const result = collectionProgress(0, 0);

    expect(result.total).toBe(0);
    expect(result.complete).toBe(false);
    expect(result.progress).toBe(0);
  });
});

describe("prizeReveal", () => {
  it("keeps the prize secret below the requirement", () => {
    const result = prizeReveal({
      collected: 2,
      required: 4,
      announced: false,
    });

    expect(result.revealed).toBe(false);
    expect(result.earned).toBe(false);
    expect(result.announced).toBe(false);
    expect(result.badgesToGo).toBe(2);
    expect(result.required).toBe(4);
  });

  it("reveals the prize exactly at the requirement", () => {
    const result = prizeReveal({
      collected: 4,
      required: 4,
      announced: false,
    });

    expect(result.revealed).toBe(true);
    expect(result.earned).toBe(true);
    expect(result.badgesToGo).toBe(0);
  });

  it("keeps the prize earned above the requirement", () => {
    const result = prizeReveal({
      collected: 6,
      required: 4,
      announced: false,
    });

    expect(result.earned).toBe(true);
    expect(result.revealed).toBe(true);
    expect(result.badgesToGo).toBe(0);
  });

  it("reveals the prize to everyone once the organizer announces it", () => {
    const result = prizeReveal({
      collected: 1,
      required: 4,
      announced: true,
    });

    expect(result.revealed).toBe(true);
    expect(result.earned).toBe(false);
    expect(result.announced).toBe(true);
    expect(result.badgesToGo).toBe(3);
  });

  it("treats a zero requirement as always earned", () => {
    const result = prizeReveal({
      collected: 0,
      required: 0,
      announced: false,
    });

    expect(result.earned).toBe(true);
    expect(result.revealed).toBe(true);
    expect(result.badgesToGo).toBe(0);
    expect(result.required).toBe(0);
  });

  it("ignores a broken collection count", () => {
    const result = prizeReveal({
      collected: -3,
      required: 4,
      announced: false,
    });

    expect(result.earned).toBe(false);
    expect(result.revealed).toBe(false);
    expect(result.badgesToGo).toBe(4);
  });
});
