// lib/currency.ts
//
// Single source of truth for money DISPLAY.
//
// Payments are still charged in INR via Razorpay (the gateway is INR-bound),
// so all amounts are stored internally in paise / rupees. Everything the user
// SEES, however, is shown in USD — converted at the rate below.
//
// The rate is derived from our advertised plan prices:
//   ₹1,599 → $19   ₹2,499 → $29   ₹1,699 → $20   →  ≈ ₹85 per $1.

export const INR_PER_USD = 85;

/** Convert a paise amount (1/100 of a rupee) to a USD number. */
export function usdFromPaise(paise: number): number {
  return paise / 100 / INR_PER_USD;
}

/** Convert a whole-rupee amount to a USD number. */
export function usdFromRupees(rupees: number): number {
  return rupees / INR_PER_USD;
}

/** Format a USD number as a `$` string (e.g. `$18.81`, `$19`). */
export function formatUSD(
  usd: number,
  { minimumFractionDigits = 0, maximumFractionDigits = 2 } = {},
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(usd);
}

/** Format a paise amount directly as a USD string. */
export function formatPaiseAsUSD(
  paise: number,
  opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string {
  return formatUSD(usdFromPaise(paise), opts);
}
