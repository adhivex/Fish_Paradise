import { Card } from '@/components/ui/Card';
import { formatMoney } from '@/lib/money';
import type { Totals } from '@/lib/pricing';

export function TotalsCard({ totals, className }: { totals: Totals; className?: string }) {
  const row = 'flex items-center justify-between px-[18px] py-1.5 text-[15px]';
  return (
    <Card className={className}>
      <dl className="m-0 pt-2 pb-3">
        <div className={row}>
          <dt>Subtotal</dt>
          <dd className="m-0">{formatMoney(totals.subtotalPaise)}</dd>
        </div>
        {totals.discountPaise > 0 && (
          <div className={row}>
            <dt>Discount</dt>
            <dd className="text-success m-0">−{formatMoney(totals.discountPaise)}</dd>
          </div>
        )}
        <div className={row}>
          <dt>Delivery</dt>
          <dd className="m-0">
            {totals.deliveryFeePaise === 0 ? 'Free' : formatMoney(totals.deliveryFeePaise)}
          </dd>
        </div>
        <div className={`${row} pt-3.5 font-serif text-[22px] font-semibold`}>
          <dt>Total</dt>
          <dd className="m-0">{formatMoney(totals.totalPaise)}</dd>
        </div>
      </dl>
    </Card>
  );
}
