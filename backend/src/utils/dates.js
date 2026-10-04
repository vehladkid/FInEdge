// Pure ISO-date ("YYYY-MM-DD") helpers. All arithmetic is UTC so results never
// depend on the server's timezone.

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value) {
  if (typeof value !== "string" || !ISO.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  // Round-trip: "2026-02-30" parses to a different calendar day, so it is rejected.
  return !Number.isNaN(date.getTime()) && toIso(date) === value;
}

export const toIso = (date) => date.toISOString().slice(0, 10);
const parse = (iso) => new Date(`${iso}T00:00:00Z`);

export function addDays(iso, days) {
  const date = parse(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

export function startOfMonth(iso) {
  return `${iso.slice(0, 7)}-01`;
}

export function endOfMonth(iso) {
  const date = parse(startOfMonth(iso));
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return toIso(date);
}

// First day of the month `count` months before the month containing `iso`.
export function shiftMonths(iso, count) {
  const date = parse(startOfMonth(iso));
  date.setUTCMonth(date.getUTCMonth() + count);
  return toIso(date);
}

// Last day (inclusive) of a budget period beginning on `start`.
export function endOfPeriod(period, start) {
  if (period === "weekly") return addDays(start, 6);
  if (period === "monthly") {
    const date = parse(start);
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + 1);
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
    ).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
    return addDays(toIso(date), -1);
  }
  if (period === "yearly") {
    const date = parse(start);
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCFullYear(date.getUTCFullYear() + 1);
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
    ).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
    return addDays(toIso(date), -1);
  }
  throw new Error(`Unknown budget period: ${period}`);
}
