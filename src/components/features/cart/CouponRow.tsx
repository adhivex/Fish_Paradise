'use client';

import { useId, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

/**
 * Coupon entry. Codes are validated server-side from Phase 4 (`POST /api/coupons/validate`);
 * the mock catalogue has no coupons, so every code is reported as not valid.
 */
export function CouponRow() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const inputId = useId();

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
        const trimmed = code.trim().toUpperCase();
        setMessage(trimmed ? `“${trimmed}” is not a valid coupon.` : 'Enter a coupon code.');
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
          onChange={(e) => {
            setCode(e.target.value.slice(0, 24));
            setMessage(null);
          }}
          autoCapitalize="characters"
          autoComplete="off"
          aria-describedby={message ? `${inputId}-msg` : undefined}
          className="border-line-strong bg-card h-11 min-w-0 flex-1 rounded-xl border px-3.5 text-[15px] uppercase placeholder:normal-case"
          placeholder="Enter code"
        />
        <button type="submit" className="bg-ink text-cream h-11 rounded-xl px-4 text-sm font-semibold">
          Apply
        </button>
      </div>
      {message && (
        <p id={`${inputId}-msg`} role="alert" className="text-danger mt-2 mb-0 text-[13px]">
          {message}
        </p>
      )}
    </form>
  );
}
