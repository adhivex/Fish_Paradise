/** All money is integer paise (₹1 = 100 paise). Format only at the UI edge. */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Converts whole rupees to paise. Use for seed/mock data only. */
export function rupees(amount: number): number {
  return Math.round(amount * 100);
}

/** `108000` → `₹1,080`, `12345` → `₹123.45`, `10800000` → `₹1,08,000`. */
export function formatMoney(paise: number): string {
  if (!Number.isInteger(paise)) throw new Error(`formatMoney expects integer paise, got ${paise}`);
  return inr.format(paise / 100).replace(/ /g, '');
}

/** `32000` → `₹320/kg` */
export function formatPricePerKg(paise: number): string {
  return `${formatMoney(paise)}/kg`;
}
