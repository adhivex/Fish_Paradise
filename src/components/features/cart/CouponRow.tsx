'use client';

import { useId, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { TextButton } from '@/components/ui/TextLink';
import type { CartQuote } from '@/lib/cart';
import { formatMoney } from '@/lib/money';
import { useCartStore } from '@/lib/stores/cart';

/** Coupon entry. The code is stored with the cart; the server quote says if and how it applies. */
export function CouponRow({ coupon, discountPaise }: { coupon: CartQuote['coupon']; discountPaise: number }) {
  const couponCode = useCartStore((s) => s.couponCode);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const inputId = useId();

  if (couponCode) {
    const applied = coupon?.applied;
    return (
      <div
        className={`mx-4 mt-3.5 flex min-h-[54px] items-center gap-2.5 rounded-2xl border border-dashed px-4 py-2 text-sm ${
          applied === false ? 'border-danger/60' : 'border-line-dashed'
        }`}
        role="status"
      >
        <Icon name="tag" className="text-gold-glyph" />
        <div className="min-w-0 flex-1">
          <b>{couponCode}</b>
          {applied === true && (
            <span className="text-success block text-[13px]">You save {formatMoney(discountPaise)}</span>
          )}
          {applied === false && <span className="text-danger block text-[13px]">{coupon?.message}</span>}
        </div>
        <TextButton onClick={() => setCoupon(null)}>Remove</TextButton>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded="false"
        className="border-line-dashed hover:bg-gold-soft/50 mx-4 mt-3.5 flex h-[54px] w-[calc(100%-32px)] items-center gap-2.5 rounded-2xl border border-dashed bg-transparent px-4 text-left text-sm font-semibold"
      >
        <Icon name="tag" className="text-gold-glyph" />
        Apply coupon
        <Icon name="chevronRight" className="ml-auto" />
      </button>
    );
  }

  return (
    <form
      className="border-line-dashed mx-4 mt-3.5 rounded-2xl border border-dashed p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) setCoupon(code);
      }}
    >
      <label htmlFor={inputId} className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon name="tag" className="text-gold-glyph" />
        Coupon code
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          value={code}
          onChange={(e) => setCode(e.target.value.slice(0, 24))}
          autoCapitalize="characters"
          autoComplete="off"
          className="border-line-strong bg-card h-11 min-w-0 flex-1 rounded-xl border px-3.5 text-[15px] uppercase placeholder:normal-case"
          placeholder="Enter code"
        />
        <button type="submit" className="bg-ink text-cream h-11 rounded-xl px-4 text-sm font-semibold">
          Apply
        </button>
      </div>
    </form>
  );
}
