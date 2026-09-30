/** Pricing primitives used by the server-side quote (src/lib/cart.ts). */

export function lineTotalPaise(pricePerKgPaise: number, qtyGrams: number, extraPaise = 0): number {
  return Math.round((pricePerKgPaise * qtyGrams) / 1000) + extraPaise;
}

export interface DeliveryRule {
  deliveryFeePaise: number;
  freeAbovePaise: number | null;
}

export function deliveryFeePaise(subtotalPaise: number, rule: DeliveryRule): number {
  if (subtotalPaise === 0) return 0;
  if (rule.freeAbovePaise != null && subtotalPaise >= rule.freeAbovePaise) return 0;
  return rule.deliveryFeePaise;
}
