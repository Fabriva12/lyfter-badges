import { describe, expect, it } from "vitest";

import { createShareToken, parseShareToken } from "./token";

const secret = "test-secret";
const input = { userId: "user_123", eventId: "event_456" };

describe("createShareToken", () => {
  it("round trips a valid payload", () => {
    const token = createShareToken(input, secret);

    expect(parseShareToken(token, secret)).toEqual(input);
  });

  it("produces a URL-safe token", () => {
    const token = createShareToken(input, secret);

    expect(token).toMatch(/^[A-Za-z0-9_.-]+$/);
  });

  it("rejects a tampered payload", () => {
    const token = createShareToken(input, secret);
    const [, , signature] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ u: "other_user", e: input.eventId }),
    ).toString("base64url");

    expect(
      parseShareToken(`1.${tamperedPayload}.${signature}`, secret),
    ).toBeNull();
  });

  it("rejects a wrong secret", () => {
    const token = createShareToken(input, secret);

    expect(parseShareToken(token, "other-secret")).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(parseShareToken("", secret)).toBeNull();
    expect(parseShareToken("not-a-token", secret)).toBeNull();
    expect(parseShareToken("1.only-two-parts", secret)).toBeNull();
    expect(parseShareToken("2.payload.signature", secret)).toBeNull();
  });
});
