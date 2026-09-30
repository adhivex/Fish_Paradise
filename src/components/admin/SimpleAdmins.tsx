'use client';

import { formatIstDate } from '@/lib/ist';
import { formatMoney } from '@/lib/money';
import { AdminCrud } from './AdminCrud';

/** Delivery zones (pincodes + fees) and slot templates. */
export function DeliveryAdmin() {
  return (
    <div>
      <h1 className="mt-0 mb-4 font-serif text-2xl font-semibold">Delivery</h1>
      <AdminCrud
        title="Delivery areas"
        noun="Area"
        endpoint="/api/admin/zones"
        deleteHint="Customers can only check out to pincodes listed here."
        defaults={{ deliveryFeePaise: 0, minOrderPaise: 0, freeAbovePaise: null, isActive: true }}
        fields={[
          { name: 'pincode', label: 'Pincode', type: 'text', placeholder: '6 digits' },
          { name: 'areaName', label: 'Area name', type: 'text' },
          { name: 'deliveryFeePaise', label: 'Delivery fee', type: 'money' },
          {
            name: 'freeAbovePaise',
            label: 'Free delivery above',
            type: 'money',
            nullable: true,
            help: 'Leave empty for never free',
          },
          { name: 'minOrderPaise', label: 'Minimum order', type: 'money' },
          { name: 'isActive', label: 'Delivering here', type: 'boolean' },
        ]}
        summary={(z) => (
          <>
            <b>{String(z.pincode)}</b> · {String(z.areaName)}
            <span className="text-ink-muted block text-xs">
              Fee {formatMoney(z.deliveryFeePaise as number)}
              {z.freeAbovePaise != null ? ` · free above ${formatMoney(z.freeAbovePaise as number)}` : ''}
              {(z.minOrderPaise as number) > 0 ? ` · min ${formatMoney(z.minOrderPaise as number)}` : ''}
              {!z.isActive && ' · paused'}
            </span>
          </>
        )}
      />
      <AdminCrud
        title="Delivery slots"
        noun="Slot"
        endpoint="/api/admin/slots"
        deleteHint="Times are shop local time (IST). Capacity = scheduled orders per slot per day."
        defaults={{ capacity: 20, sortOrder: 0, isActive: true }}
        fields={[
          { name: 'label', label: 'Label', type: 'text', placeholder: '5:00 – 6:00 PM' },
          { name: 'startTime', label: 'Starts', type: 'time' },
          { name: 'endTime', label: 'Ends', type: 'time' },
          { name: 'capacity', label: 'Orders per day', type: 'number' },
          { name: 'sortOrder', label: 'Sort order', type: 'number' },
          { name: 'isActive', label: 'Offered', type: 'boolean' },
        ]}
        summary={(s) => (
          <>
            <b>{String(s.label)}</b>
            <span className="text-ink-muted block text-xs">
              {String(s.startTime)}–{String(s.endTime)} · up to {String(s.capacity)} orders
              {!s.isActive && ' · paused'}
            </span>
          </>
        )}
      />
    </div>
  );
}

export function CouponsAdmin() {
  return (
    <div>
      <h1 className="mt-0 mb-4 font-serif text-2xl font-semibold">Coupons</h1>
      <AdminCrud
        title="All coupons"
        noun="Coupon"
        endpoint="/api/admin/coupons"
        deleteHint="Coupons that were used are deactivated instead of deleted."
        defaults={{ type: 'PERCENT', minSubtotalPaise: 0, isActive: true }}
        fields={[
          { name: 'code', label: 'Code', type: 'text', placeholder: 'e.g. FRESH10' },
          { name: 'description', label: 'Description', type: 'text', nullable: true },
          {
            name: 'type',
            label: 'Type',
            type: 'select',
            options: [
              { value: 'PERCENT', label: 'Percent off' },
              { value: 'FLAT', label: 'Flat amount off (paise)' },
            ],
          },
          {
            name: 'value',
            label: 'Value',
            type: 'number',
            help: 'Percent (1–100) or flat amount in paise (₹50 = 5000)',
          },
          { name: 'minSubtotalPaise', label: 'Minimum order', type: 'money' },
          { name: 'maxDiscountPaise', label: 'Maximum discount', type: 'money', nullable: true },
          { name: 'startsAt', label: 'Starts', type: 'datetime', nullable: true },
          { name: 'endsAt', label: 'Ends', type: 'datetime', nullable: true },
          {
            name: 'totalUsageLimit',
            label: 'Total uses',
            type: 'number',
            nullable: true,
            help: 'Empty = unlimited',
          },
          { name: 'perUserLimit', label: 'Uses per customer', type: 'number', nullable: true },
          { name: 'isActive', label: 'Active', type: 'boolean' },
        ]}
        summary={(c) => (
          <>
            <b>{String(c.code)}</b>{' '}
            <span className="text-ink-muted">
              {c.type === 'PERCENT' ? `${String(c.value)}% off` : `${formatMoney(c.value as number)} off`}
            </span>
            <span className="text-ink-muted block text-xs">
              Used {String(c.usedCount)}
              {c.totalUsageLimit != null ? `/${String(c.totalUsageLimit)}` : ''}
              {c.endsAt ? ` · ends ${formatIstDate(new Date(c.endsAt as string))}` : ''}
              {!c.isActive && ' · inactive'}
            </span>
          </>
        )}
      />
    </div>
  );
}
