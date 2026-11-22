import { describe, expect, it } from "vitest";

import {
  buildCollectionShareText,
  buildShareText,
  buildShareUrls,
} from "./share";

const badgeName = "Solar Spark";
const eventName = "Lyfter Summit 2026";
const xp = 50;
const url = "https://example.com/badge/abc123";
const text = "I collected the Solar Spark badge at Lyfter Summit 2026 (+50 XP) with Lyfter Badges.";

describe("buildShareText", () => {
  it("includes the badge name in the share text", () => {
    const result = buildShareText({ badgeName, eventName, xp });

    expect(result).toContain(badgeName);
  });

  it("includes the event name in the share text", () => {
    const result = buildShareText({ badgeName, eventName, xp });

    expect(result).toContain(eventName);
  });

  it("includes the xp value in the share text", () => {
    const result = buildShareText({ badgeName, eventName, xp });

    expect(result).toContain("+50 XP");
  });
});

describe("buildCollectionShareText", () => {
  it("includes the attendee, event, badge count and xp", () => {
    const result = buildCollectionShareText({
      attendeeName: "Ada Lovelace",
      eventName,
      collected: 3,
      total: 5,
      xp: 120,
    });

    expect(result).toContain("Ada Lovelace");
    expect(result).toContain(eventName);
    expect(result).toContain("3 of 5 badges");
    expect(result).toContain("120 XP");
  });

  it("uses the singular badge word when the event has one badge", () => {
    const result = buildCollectionShareText({
      attendeeName: "Ada Lovelace",
      eventName,
      collected: 1,
      total: 1,
      xp: 50,
    });

    expect(result).toContain("1 of 1 badge ");
  });
});

describe("buildShareUrls", () => {
  it("builds the x intent with the correct host", () => {
    const result = buildShareUrls({ url, text });

    expect(result.x).toContain("https://twitter.com/intent/tweet");
  });

  it("builds the whatsapp intent with the correct host", () => {
    const result = buildShareUrls({ url, text });

    expect(result.whatsapp).toContain("https://wa.me/");
  });

  it("builds the facebook intent with the correct host", () => {
    const result = buildShareUrls({ url, text });

    expect(result.facebook).toContain("https://www.facebook.com/sharer/sharer.php");
  });

  it("builds the linkedin intent with the correct host", () => {
    const result = buildShareUrls({ url, text });

    expect(result.linkedin).toContain(
      "https://www.linkedin.com/sharing/share-offsite/",
    );
    expect(result.linkedin).toContain(encodeURIComponent(url));
  });

  it("url encodes special characters and spaces", () => {
    const input = {
      url: "https://example.com/badge/test?ref=share&id=123",
      text: "Hello world & friends!",
    };
    const result = buildShareUrls(input);

    expect(result.x).toContain(encodeURIComponent(input.url));
    expect(result.x).toContain(encodeURIComponent(input.text));
  });

  it("includes both text and url in the whatsapp intent", () => {
    const result = buildShareUrls({ url, text });

    expect(result.whatsapp).toContain(encodeURIComponent(text));
    expect(result.whatsapp).toContain(encodeURIComponent(url));
  });

  it("keeps the facebook intent valid with empty text", () => {
    const result = buildShareUrls({ url, text: "" });

    expect(result.facebook).toContain("https://www.facebook.com/sharer/sharer.php?u=");
  });

  it("returns the same result for identical inputs", () => {
    const first = buildShareUrls({ url, text });
    const second = buildShareUrls({ url, text });

    expect(first.x).toBe(second.x);
    expect(first.whatsapp).toBe(second.whatsapp);
    expect(first.facebook).toBe(second.facebook);
    expect(first.linkedin).toBe(second.linkedin);
  });
});
