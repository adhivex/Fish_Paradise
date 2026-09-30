import 'server-only';
import { mergeLines, type CartLine, type CartQuote } from '@/lib/cart';
import { normalizeCouponCode } from '@/lib/coupons';
import { clampQty } from '@/lib/qty';
import { db } from '@/server/db';
import { loadProducts, priceLines } from '@/server/services/pricing';

export interface CartState {
  items: CartLine[];
  notes: string;
  couponCode: string | null;
}

export interface CartView extends CartState {
  quote: CartQuote;
}

export async function readCart(userId: string): Promise<CartState> {
  const cart = await db.cart.findUnique({
    where: { userId },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  return {
    items: (cart?.items ?? []).map((i) => ({
      productId: i.productId,
      qtyGrams: i.qtyGrams,
      cleaningOptionId: i.cleaningOptionId,
      lineNote: i.lineNote,
    })),
    notes: cart?.notes ?? '',
    couponCode: cart?.couponCode ?? null,
  };
}

/**
 * Keeps only lines for products that exist, one line per product, snapped onto the product's
 * quantity grid and pointing at an existing cleaning option. Availability is reported by the quote.
 */
async function sanitize(items: readonly CartLine[]): Promise<CartLine[]> {
  const products = await loadProducts(
    db,
    items.map((i) => i.productId),
  );
  const cleaningIds = new Set(
    (await db.cleaningOption.findMany({ where: { isActive: true }, select: { id: true } })).map((c) => c.id),
  );
  const seen = new Set<string>();
  const out: CartLine[] = [];
  for (const item of items) {
    const p = products.get(item.productId);
    if (!p || seen.has(p.id) || !cleaningIds.has(item.cleaningOptionId)) continue;
    seen.add(p.id);
    const qty = clampQty(item.qtyGrams, { ...p, stockGrams: null });
    out.push({ ...item, qtyGrams: qty || p.minQtyGrams, lineNote: item.lineNote?.trim() || null });
  }
  return out;
}

async function writeCart(userId: string, state: CartState): Promise<void> {
  await db.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({
      where: { userId },
      update: { notes: state.notes, couponCode: state.couponCode },
      create: { userId, notes: state.notes, couponCode: state.couponCode },
    });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    if (state.items.length > 0) {
      await tx.cartItem.createMany({
        data: state.items.map((i) => ({
          cartId: cart.id,
          productId: i.productId,
          qtyGrams: i.qtyGrams,
          cleaningOptionId: i.cleaningOptionId,
          lineNote: i.lineNote ?? null,
        })),
      });
    }
  });
}

async function view(userId: string, state: CartState, pincode?: string | null): Promise<CartView> {
  const quote = await priceLines({ lines: state.items, couponCode: state.couponCode, pincode, userId });
  return { ...state, quote };
}

export async function getCart(userId: string, pincode?: string | null): Promise<CartView> {
  return view(userId, await readCart(userId), pincode);
}

export async function replaceCart(
  userId: string,
  input: Partial<CartState> & { items: CartLine[] },
): Promise<CartView> {
  const current = await readCart(userId);
  const state: CartState = {
    items: await sanitize(input.items),
    notes: (input.notes ?? current.notes).slice(0, 500),
    couponCode:
      input.couponCode === undefined
        ? current.couponCode
        : input.couponCode
          ? normalizeCouponCode(input.couponCode)
          : null,
  };
  await writeCart(userId, state);
  return view(userId, state);
}

/** Merges the guest (localStorage) cart into the user's server cart after login. */
export async function mergeGuestCart(userId: string, guest: CartState): Promise<CartView> {
  const current = await readCart(userId);
  const products = await loadProducts(
    db,
    [...current.items, ...guest.items].map((i) => i.productId),
  );
  const items = mergeLines(current.items, guest.items, (id) => products.get(id));
  const state: CartState = {
    items: await sanitize(items),
    notes: current.notes || guest.notes,
    couponCode: current.couponCode ?? (guest.couponCode ? normalizeCouponCode(guest.couponCode) : null),
  };
  await writeCart(userId, state);
  return view(userId, state);
}

export async function clearCart(userId: string): Promise<void> {
  await db.cart.updateMany({ where: { userId }, data: { notes: null, couponCode: null } });
  await db.cartItem.deleteMany({ where: { cart: { userId } } });
}
