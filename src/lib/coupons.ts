/** Coupon rules (PRD §5): percent or flat, min subtotal, max discount, validity, usage limits. */

export interface CouponRule {
  code: string;
  type: 'PERCENT' | 'FLAT';
  /** Percent 1–100, or flat amount in paise. */
  value: number;
  minSubtotalPaise: number;
  maxDiscountPaise: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  totalUsageLimit: number | null;
  perUserLimit: number | null;
  usedCount: number;
  isActive: boolean;
}

export type CouponResult = { ok: true; discountPaise: number } | { ok: false; message: string };

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function evaluateCoupon(
  coupon: CouponRule | null,
  ctx: { subtotalPaise: number; now: Date; userUses: number | null },
): CouponResult {
  if (!coupon || !coupon.isActive) return { ok: false, message: 'This coupon is not valid.' };
  if (coupon.startsAt && ctx.now < coupon.startsAt)
    return { ok: false, message: 'This coupon is not active yet.' };
  if (coupon.endsAt && ctx.now > coupon.endsAt) return { ok: false, message: 'This coupon has expired.' };
  if (coupon.totalUsageLimit !== null && coupon.usedCount >= coupon.totalUsageLimit) {
    return { ok: false, message: 'This coupon has been fully redeemed.' };
  }
  if (coupon.perUserLimit !== null && ctx.userUses !== null && ctx.userUses >= coupon.perUserLimit) {
    return { ok: false, message: 'You have already used this coupon.' };
  }
  if (ctx.subtotalPaise < coupon.minSubtotalPaise) {
    const need = (coupon.minSubtotalPaise / 100).toLocaleString('en-IN');
    return { ok: false, message: `Add items worth ₹${need} or more to use this coupon.` };
  }
  let discount =
    coupon.type === 'PERCENT' ? Math.floor((ctx.subtotalPaise * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscountPaise !== null) discount = Math.min(discount, coupon.maxDiscountPaise);
  discount = Math.max(0, Math.min(discount, ctx.subtotalPaise));
  return { ok: true, discountPaise: discount };
}
