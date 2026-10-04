// `decimals` is an explicit argument because the screens genuinely differ — the
// dashboard cards show cents ("$42.10") where the landing preview shows whole dollars.
// Negative amounts put the sign before the symbol ("-$42.10", not "$-42.10").

export function formatCurrency(amount, decimals = 0) {
  const abs = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${amount < 0 && Number(abs.replace(/,/g, "")) !== 0 ? "-" : ""}$${abs}`;
}
