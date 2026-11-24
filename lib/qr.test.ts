import { describe, expect, it } from "vitest";

import { parseScanPayload } from "./qr";

const TOKEN = "3f0c2a9e-8b1d-4c7e-9a2f-6d5b8e1c4a70";

describe("parseScanPayload", () => {
  it("accepts a raw token", () => {
    expect(parseScanPayload(TOKEN)).toEqual({ token: TOKEN });
  });

  it("accepts a relative scan path", () => {
    expect(parseScanPayload(`/s/${TOKEN}`)).toEqual({ token: TOKEN });
  });

  it("accepts a relative scan path with a trailing slash", () => {
    expect(parseScanPayload(`/s/${TOKEN}/`)).toEqual({ token: TOKEN });
  });

  it("accepts a relative scan path with query and hash", () => {
    expect(parseScanPayload(`/s/${TOKEN}?from=qr#top`)).toEqual({
      token: TOKEN,
    });
  });

  it("accepts an absolute https URL", () => {
    expect(parseScanPayload(`https://badges.example.com/s/${TOKEN}`)).toEqual({
      token: TOKEN,
    });
  });

  it("accepts an absolute http URL with a port and query", () => {
    expect(
      parseScanPayload(`http://192.168.1.20:3000/s/${TOKEN}?event=lyfter`),
    ).toEqual({ token: TOKEN });
  });

  it("decodes a percent-encoded token", () => {
    expect(parseScanPayload("/s/abc%2Ddef1234")).toEqual({ token: "abc-def1234" });
  });

  it("trims surrounding whitespace", () => {
    expect(parseScanPayload(`  /s/${TOKEN}  `)).toEqual({ token: TOKEN });
  });

  it("rejects an empty payload", () => {
    expect(parseScanPayload("   ")).toBeNull();
  });

  it("rejects a URL that is not a scan URL", () => {
    expect(parseScanPayload(`https://badges.example.com/events/${TOKEN}`)).toBeNull();
  });

  it("rejects a relative path that is not a scan URL", () => {
    expect(parseScanPayload(`/events/${TOKEN}`)).toBeNull();
  });

  it("rejects a token that is too short", () => {
    expect(parseScanPayload("/s/abc123")).toBeNull();
  });

  it("rejects a token with invalid characters", () => {
    expect(parseScanPayload("/s/abc def1234")).toBeNull();
    expect(parseScanPayload("/s/abc/def1234")).toBeNull();
  });

  it("rejects a malformed percent-encoded token", () => {
    expect(parseScanPayload("/s/%E0%A4%A")).toBeNull();
  });

  it("rejects a payload longer than the limit", () => {
    expect(parseScanPayload(`/s/${"a".repeat(3000)}`)).toBeNull();
  });
});
