import { round2 } from "../utils/money.js";

// Pure budget arithmetic. "warning" starts at 80% used; "exceeded" is strictly
// over the allocation (spending exactly the amount is 100% but not exceeded).
export const WARNING_THRESHOLD = 80;

export function budgetStatus(amount, spent) {
  const remaining = round2(amount - spent);
  const percentUsed = amount > 0 ? Math.round((spent / amount) * 1000) / 10 : 0;
  const exceeded = spent > amount;
  let status = "ok";
  if (exceeded) status = "exceeded";
  else if (percentUsed >= WARNING_THRESHOLD) status = "warning";
  return { spent: round2(spent), remaining, percentUsed, exceeded, status };
}
