/** All weights are integer grams. */

export interface QtyRules {
  minQtyGrams: number;
  stepGrams: number;
  maxQtyGrams: number;
  /** null = stock not tracked */
  stockGrams?: number | null;
}

/** `500` → `500 g`, `1000` → `1 kg`, `1500` → `1.5 kg`, `1250` → `1.3 kg` */
export function formatQty(grams: number): string {
  if (!Number.isInteger(grams) || grams < 0) throw new Error(`formatQty expects integer grams, got ${grams}`);
  if (grams < 1000) return `${grams} g`;
  const kg = Math.round(grams / 100) / 10;
  return `${Number.isInteger(kg) ? kg.toFixed(0) : kg.toFixed(1)} kg`;
}

/** Largest quantity allowed for a product, honouring tracked stock. 0 = cannot be bought. */
export function maxAllowedGrams(rules: QtyRules): number {
  const cap = rules.stockGrams == null ? rules.maxQtyGrams : Math.min(rules.maxQtyGrams, rules.stockGrams);
  const steps = Math.floor((cap - rules.minQtyGrams) / rules.stepGrams);
  return steps < 0 ? 0 : rules.minQtyGrams + steps * rules.stepGrams;
}

/** Clamp and snap any quantity onto the product's min/step/max grid. */
export function clampQty(grams: number, rules: QtyRules): number {
  const max = maxAllowedGrams(rules);
  if (max === 0) return 0;
  const snapped =
    rules.minQtyGrams + Math.round((grams - rules.minQtyGrams) / rules.stepGrams) * rules.stepGrams;
  return Math.min(max, Math.max(rules.minQtyGrams, snapped));
}

export function stepQty(grams: number, direction: 1 | -1, rules: QtyRules): number {
  return clampQty(grams + direction * rules.stepGrams, rules);
}

export function isValidQty(grams: number, rules: QtyRules): boolean {
  return (
    Number.isInteger(grams) &&
    grams >= rules.minQtyGrams &&
    grams <= maxAllowedGrams(rules) &&
    (grams - rules.minQtyGrams) % rules.stepGrams === 0
  );
}
