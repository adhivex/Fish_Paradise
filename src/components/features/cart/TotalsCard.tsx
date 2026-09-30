import { Card } from '@/components/ui/Card';
import { formatMoney } from '@/lib/money';

interface Totals {
  subtotalPaise: number;
  discountPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
}

/** Subtotal / discount / delivery / total – always values returned by the server. */
export function TotalsCard({
  totals,
  couponCode,
  deliveryEstimated = false,
  className,
}: {
  totals: Totals;
  couponCode?: string | null;
  deliveryEstimated?: boolean;
  className?: string;
}) {
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
            <dt>Discount{couponCode ? ` (${couponCode})` : ''}</dt>
            <dd className="text-success m-0">−{formatMoney(totals.discountPaise)}</dd>
          </div>
        )}
        <div className={row}>
          <dt>
            Delivery
            {deliveryEstimated && <span className="text-ink-muted ml-1 text-[13px]">(est.)</span>}
          </dt>
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
