import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface OptionGroupProps {
  label: string;
  /** Visually show the label as an eyebrow heading. */
  showLabel?: boolean;
  columns?: 1 | 2;
  children: ReactNode;
  className?: string;
  legendClassName?: string;
}

/** Native radio group: arrow keys, form semantics and screen-reader state come for free. */
export function OptionGroup({
  label,
  showLabel = true,
  columns = 2,
  children,
  className,
  legendClassName,
}: OptionGroupProps) {
  return (
    <fieldset className={cn('m-0 min-w-0 border-0 p-0', className)}>
      <legend
        className={
          showLabel
            ? cn(
                'text-ink-muted p-0 font-bold tracking-[0.14em] uppercase',
                legendClassName ?? 'mb-3 text-xs',
              )
            : 'sr-only'
        }
      >
        {label}
      </legend>
      <div className={cn('grid gap-2.5', columns === 2 ? 'grid-cols-2' : 'grid-cols-1')}>{children}</div>
    </fieldset>
  );
}

interface OptionCardProps {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  size?: 'sm' | 'lg';
  disabled?: boolean;
}

/**
 * Radio-style card. Selected = ink border + inset ring + gold-soft background + filled radio dot,
 * so the state never relies on colour alone.
 */
export function OptionCard({
  name,
  value,
  checked,
  onSelect,
  title,
  subtitle,
  size = 'sm',
  disabled,
}: OptionCardProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2.5 border text-left transition-colors duration-150',
        'has-[:focus-visible]:outline-gold-dark has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
        size === 'sm'
          ? 'min-h-[50px] rounded-2xl px-3.5 py-1.5 text-sm font-semibold'
          : 'min-h-16 gap-3.5 rounded-[18px] px-4 py-2',
        checked
          ? 'border-ink bg-gold-soft shadow-[inset_0_0_0_1px_var(--color-ink)]'
          : 'border-line-strong bg-card hover:border-rail',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'block size-5 flex-none rounded-full',
          checked ? 'border-ink border-[6px]' : 'border-radio border-[1.5px]',
        )}
      />
      {subtitle ? (
        <span className="flex flex-col gap-0.5">
          <b className="text-[15px] font-bold">{title}</b>
          <span className="text-ink-muted text-[13px] font-normal">{subtitle}</span>
        </span>
      ) : (
        <span>{title}</span>
      )}
    </label>
  );
}
