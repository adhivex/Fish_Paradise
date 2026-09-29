import { computeTotals, lineTotalPaise, type DeliveryRule, type Totals } from '@/lib/pricing';
import { clampQty } from '@/lib/qty';
import type { CleaningOptionDTO, ProductDTO } from '@/lib/types';

/** What the client keeps (and later sends to the server): ids + grams + cleaning. Never prices. */
export interface CartLine {
  productId: string;
  qtyGrams: number;
  cleaningOptionId: string;
}

export interface PricedCartLine extends CartLine {
  product: ProductDTO;
  cleaningLabel: string;
  lineTotalPaise: number;
  available: boolean;
}

export interface PricedCart {
  lines: PricedCartLine[];
  totals: Totals;
  hasUnavailable: boolean;
}

/** Adds to an existing line (grams add up, cleaning option is replaced) or appends a new line. */
export function addLine(lines: readonly CartLine[], add: CartLine, product: ProductDTO): CartLine[] {
  const existing = lines.find((l) => l.productId === add.productId);
  if (!existing) return [...lines, { ...add, qtyGrams: clampQty(add.qtyGrams, product) }];
  return lines.map((l) =>
    l.productId === add.productId
      ? {
          ...l,
          qtyGrams: clampQty(l.qtyGrams + add.qtyGrams, product),
          cleaningOptionId: add.cleaningOptionId,
        }
      : l,
  );
}

export function priceCart(
  lines: readonly CartLine[],
  catalogue: {
    product: (id: string) => ProductDTO | undefined;
    cleaning: readonly CleaningOptionDTO[];
  },
  delivery: DeliveryRule,
): PricedCart {
  const priced: PricedCartLine[] = [];
  for (const line of lines) {
    const product = catalogue.product(line.productId);
    if (!product) continue;
    const option = catalogue.cleaning.find((o) => o.id === line.cleaningOptionId);
    const available = product.todayAvailable;
    priced.push({
      ...line,
      product,
      cleaningLabel: option?.label ?? 'Whole cleaned',
      available,
      lineTotalPaise: available
        ? lineTotalPaise(product.pricePerKgPaise, line.qtyGrams, option?.extraPaise ?? 0)
        : 0,
    });
  }
  const billable = priced.filter((l) => l.available);
  return {
    lines: priced,
    totals: computeTotals(billable, delivery),
    hasUnavailable: billable.length !== priced.length,
  };
}
