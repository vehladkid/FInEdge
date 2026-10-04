// Today's date in the user's local timezone as YYYY-MM-DD (for <input type="date">).
export const todayLocal = () => new Date().toLocaleDateString("en-CA");

export const firstOfMonthLocal = () => `${todayLocal().slice(0, 7)}-01`;

// "2026-05" -> "May 2026"
export function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}
