import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { BRAND_COLORS, SAGE_TINT_RGBA, UI_COLORS } from "./colors";

const css = readFileSync(path.resolve(process.cwd(), "app/globals.css"), "utf8");

const themeColors = new Map<string, string>();
for (const match of css.matchAll(
  /--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g,
)) {
  themeColors.set(match[1], match[2].toLowerCase());
}

// --background and --foreground are declared in :root; @theme inline only
// aliases them as var(--background) / var(--foreground), with no hex to match.
const rootColors = new Map<string, string>();
for (const match of css.matchAll(
  /--(background|foreground):\s*(#[0-9a-fA-F]{6})/g,
)) {
  rootColors.set(match[1], match[2].toLowerCase());
}

function cssColor(token: string): string | undefined {
  return themeColors.get(token) ?? rootColors.get(token);
}

describe("design tokens", () => {
  it("BRAND_COLORS matches the @theme palette", () => {
    for (const [token, value] of Object.entries(BRAND_COLORS)) {
      expect(cssColor(token), token).toBe(value.toLowerCase());
    }
  });

  it("UI_COLORS matches @theme, with background and foreground from :root", () => {
    for (const [token, value] of Object.entries(UI_COLORS)) {
      expect(cssColor(token), token).toBe(value.toLowerCase());
    }

    expect(rootColors.size).toBe(2);
    expect(themeColors.has("background")).toBe(false);
    expect(themeColors.has("foreground")).toBe(false);
  });

  it("SAGE_TINT_RGBA derives from BRAND_COLORS.sage", () => {
    expect(SAGE_TINT_RGBA).toBe("rgba(173, 209, 149, 0.15)");
  });
});
