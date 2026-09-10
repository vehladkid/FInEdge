// Design tokens — one definition shared by Tailwind (CSS) and Recharts (JS props).
//
// Recharts takes colours as JavaScript props, so Tailwind classes cannot reach it.
// That is why these live here rather than only in tailwind.config.js, which imports
// `palette` from this file so both systems agree on the same values.
//
// Every hex below is the exact value the pages already used, so rendering is unchanged.

export const palette = {
  surface: "#020617", // slate-950 — page background
  panel: "#0f172a", // slate-900 — cards and chart tooltips
  edge: "#1e293b", // slate-800 — borders
  muted: "#64748b", // slate-500 — axis labels
  text: "#e2e8f0", // slate-200 — tooltip text
  brand: "#6366f1", // indigo-500 — primary series
  brandLight: "#818cf8", // indigo-400 — line dots
};

// Categorical series colours, in the order the Analytics pie already used them.
export const chartSeries = [
  palette.brand,
  "#38bdf8",
  "#a855f7",
  "#f472b6",
  palette.muted,
];

// Was defined twice: inline in Dashboard and as `tooltipStyle` in Analytics.
export const tooltipStyle = {
  backgroundColor: palette.panel,
  border: `1px solid ${palette.edge}`,
  borderRadius: "8px",
  color: palette.text,
};

// Shared XAxis/YAxis presentation.
export const axisStyle = { stroke: palette.muted, fontSize: 12 };
