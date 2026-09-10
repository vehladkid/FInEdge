// Single source of truth for spending categories.
//
// The same concept was previously spelled three different ways across the app
// ("Food & Dining" in the transaction form and budget list, "Food" in the
// analytics pie). Renaming either would have changed the visible UI, so the
// identifier is separated from the display text instead:
//
//   id         — stable internal key, safe to persist or send to an API
//   label      — canonical user-facing name
//   shortLabel — compact form for charts, where space is tight
//
// Both existing labels are therefore preserved while the concept has one definition.

export const CATEGORIES = [
  { id: "food", label: "Food & Dining", shortLabel: "Food" },
  { id: "transport", label: "Transport" },
  { id: "shopping", label: "Shopping" },
  { id: "utilities", label: "Utilities" },
  { id: "entertainment", label: "Entertainment" },
  { id: "other", label: "Other" },
];

const BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

export function getCategory(id) {
  const category = BY_ID.get(id);
  if (!category) throw new Error(`Unknown category id: ${id}`);
  return category;
}

export function categoryLabel(id) {
  return getCategory(id).label;
}

export function categoryChartLabel(id) {
  const category = getCategory(id);
  return category.shortLabel ?? category.label;
}
