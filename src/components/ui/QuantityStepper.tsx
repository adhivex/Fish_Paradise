import { cn } from '@/lib/cn';
import { formatQty } from '@/lib/qty';
import { Icon } from './Icon';

interface StepperProps {
  grams: number;
  onStep: (direction: 1 | -1) => void;
  canDecrease: boolean;
  canIncrease: boolean;
  /** Used in the aria-labels, e.g. "Decrease Pomfret". */
  itemName: string;
  variant?: 'pill' | 'compact';
}

/** Quantity control in weight steps (500 g by default). */
export function QuantityStepper({
  grams,
  onStep,
  canDecrease,
  canIncrease,
  itemName,
  variant = 'pill',
}: StepperProps) {
  const label = formatQty(grams);

  if (variant === 'compact') {
    const btn =
      'flex size-11 items-center justify-center rounded-xl disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:[&>span]:bg-gold-soft';
    const ring =
      'flex size-[30px] items-center justify-center rounded-full border border-rail transition-colors';
    return (
      <div className="mt-1.5 inline-flex items-center gap-0.5">
        <button
          type="button"
          className={btn}
          aria-label={`Decrease ${itemName}`}
          disabled={!canDecrease}
          onClick={() => onStep(-1)}
        >
          <span className={ring}>
            <Icon name="minus" size={14} />
          </span>
        </button>
        <span className="min-w-[52px] text-center text-sm font-bold" aria-live="polite">
          {label}
        </span>
        <button
          type="button"
          className={btn}
          aria-label={`Increase ${itemName}`}
          disabled={!canIncrease}
          onClick={() => onStep(1)}
        >
          <span className={ring}>
            <Icon name="plus" size={14} />
          </span>
        </button>
      </div>
    );
  }

  const round =
    'flex size-11 items-center justify-center rounded-full bg-ink text-gold transition-opacity disabled:cursor-not-allowed disabled:opacity-35';
  return (
    <div className="border-line-strong bg-card flex items-center justify-between rounded-[30px] border p-1">
      <button
        type="button"
        className={round}
        aria-label="Decrease quantity"
        disabled={!canDecrease}
        onClick={() => onStep(-1)}
      >
        <Icon name="minus" />
      </button>
      <span className={cn('font-serif text-xl font-semibold')} aria-live="polite">
        {label}
      </span>
      <button
        type="button"
        className={round}
        aria-label="Increase quantity"
        disabled={!canIncrease}
        onClick={() => onStep(1)}
      >
        <Icon name="plus" />
      </button>
    </div>
  );
}
