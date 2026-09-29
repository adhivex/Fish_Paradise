/**
 * Pricing helpers. In Phase 1 these run on the client against mock data; from Phase 4 the
 * server re-prices everything with the same functions and the client only displays results.
 */

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

export interface Totals {
  subtotalPaise: number;
  deliveryFeePaise: number;
  discountPaise: number;
  totalPaise: number;
}

export function computeTotals(
  lines: ReadonlyArray<{ lineTotalPaise: number }>,
  rule: DeliveryRule,
  discountPaise = 0,
): Totals {
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalPaise, 0);
  const discount = Math.min(discountPaise, subtotal);
  const fee = deliveryFeePaise(subtotal, rule);
  return {
    subtotalPaise: subtotal,
    deliveryFeePaise: fee,
    discountPaise: discount,
    totalPaise: subtotal - discount + fee,
  };
}
