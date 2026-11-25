export const BRAND_COLORS = {
  sage: "#add195",
  celeste: "#71ceff",
  coral: "#e88f95",
  lilac: "#d798e7",
  peach: "#ffcc8b",
  ink: "#2d323d",
} as const;

export const UI_COLORS = {
  "celeste-soft": "#7fd8f5",
  "coral-soft": "#ffb3ba",
  "sage-soft": "#b8e39a",
  muted: "#9ca3af",
  subtle: "#d7dce3",
  stroke: "#39424f",
  surface: "#252c35",
  "surface-low": "#1f252d",
  background: "#171b21",
  foreground: "#f1f1ed",
} as const;

function rgbaFromHex(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/** Sage at 15% opacity, used as the XP pill background in OG images. */
export const SAGE_TINT_RGBA = rgbaFromHex(BRAND_COLORS.sage, 0.15);
