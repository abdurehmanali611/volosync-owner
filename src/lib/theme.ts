/** Design tokens for the VoloSync Owner app — dark, saturated, high contrast. */

export const C = {
  bg: "#070B18",
  surface: "#101728",
  surfaceAlt: "#17203A",
  surfaceSoft: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.18)",

  text: "#F6F8FF",
  textMuted: "#98A6C8",
  textFaint: "#64748B",

  indigo: "#6366F1",
  violet: "#8B5CF6",
  fuchsia: "#D946EF",
  cyan: "#22D3EE",
  sky: "#38BDF8",
  emerald: "#34D399",
  lime: "#A3E635",
  amber: "#FBBF24",
  orange: "#FB923C",
  rose: "#FB7185",
  red: "#F43F5E",

  white: "#FFFFFF",
  overlay: "rgba(4,7,18,0.78)",
};

/** Paired stops for every gradient surface in the app. */
export const G = {
  hero: ["#4F46E5", "#7C3AED", "#C026D3"] as const,
  revenue: ["#059669", "#10B981", "#22D3EE"] as const,
  stock: ["#D97706", "#F59E0B", "#FB923C"] as const,
  tax: ["#0284C7", "#0EA5E9", "#6366F1"] as const,
  branch: ["#7C3AED", "#A855F7", "#EC4899"] as const,
  agents: ["#0891B2", "#06B6D4", "#8B5CF6"] as const,
  danger: ["#BE123C", "#E11D48", "#FB7185"] as const,
  slate: ["#1E293B", "#334155"] as const,
  gold: ["#B45309", "#F59E0B", "#FDE047"] as const,
  silver: ["#475569", "#94A3B8", "#CBD5E1"] as const,
  bronze: ["#7C2D12", "#C2410C", "#FB923C"] as const,
};

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const shadow = (color = "#000000", opacity = 0.35) => ({
  shadowColor: color,
  shadowOpacity: opacity,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
});

/** Gradients need at least two stops; the tuple type proves it to the compiler. */
export type Stops = readonly [string, string, ...string[]];

export type Tone = {
  label: string;
  fg: string;
  soft: string;
  stops: Stops;
};

/** Subscription health, rendered the same way on every screen. */
export function subscriptionTone(state: string): Tone {
  switch (state) {
    case "active":
      return { label: "Active", fg: C.emerald, soft: "rgba(52,211,153,0.15)", stops: G.revenue };
    case "due":
      return { label: "Renew soon", fg: C.amber, soft: "rgba(251,191,36,0.15)", stops: G.stock };
    case "expired":
      return { label: "Expired", fg: C.rose, soft: "rgba(251,113,133,0.15)", stops: G.danger };
    default:
      return { label: "Not paid yet", fg: C.orange, soft: "rgba(251,146,60,0.15)", stops: G.stock };
  }
}

/** Branch kind badge — main is gold, satellite is cool. */
export function kindTone(kind: string): Tone {
  return kind === "main"
    ? { label: "Main", fg: C.amber, soft: "rgba(251,191,36,0.15)", stops: G.gold }
    : { label: "Satellite", fg: C.cyan, soft: "rgba(34,211,238,0.14)", stops: G.agents };
}

/**
 * The company root is never a third kind: it is the main branch when it holds
 * that flag, otherwise it is just another satellite. Anything that is not main
 * is a satellite by default.
 */
export function branchKind(isMain: boolean | null | undefined): "main" | "satellite" {
  return isMain ? "main" : "satellite";
}

/** Leaderboard medal colours for ranks 1–3. */
export function medalTone(rank: number): Tone {
  if (rank === 1) return { label: "1", fg: C.amber, soft: "rgba(251,191,36,0.16)", stops: G.gold };
  if (rank === 2) return { label: "2", fg: C.sky, soft: "rgba(148,163,184,0.16)", stops: G.silver };
  if (rank === 3) return { label: "3", fg: C.orange, soft: "rgba(251,146,60,0.16)", stops: G.bronze };
  return { label: String(rank), fg: C.textMuted, soft: C.surfaceSoft, stops: G.slate };
}

/** Categorical colours for charts, in the order they are consumed. */
export const CHART = [C.indigo, C.emerald, C.amber, C.cyan, C.fuchsia, C.rose, C.lime, C.sky];
