// Currency rendering was done three different ways: a hardcoded "$4,250" string,
// a `${b.spent}` template, and `.toFixed(2)` with a hand-written sign.
//
// ponytail: `decimals` is an explicit argument rather than a fixed default because
// the existing screens genuinely differ — the dashboard shows whole dollars
// ("$4,250") and the transaction list shows cents ("$42.10"). Defaulting to 2 would
// have silently changed the dashboard.

export function formatCurrency(amount, decimals = 0) {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
