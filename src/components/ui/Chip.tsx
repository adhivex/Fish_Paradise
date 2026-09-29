import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
}

/** Selectable pill used for category tabs and order status filters. */
export function Chip({ selected, className, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'h-11 flex-none rounded-full border px-5 text-sm font-semibold tracking-[0.01em] transition-colors duration-150',
        selected
          ? 'border-ink bg-ink text-cream'
          : 'border-line-strong text-ink hover:bg-ink/5 bg-transparent',
        className,
      )}
      {...rest}
    />
  );
}

export function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-none scrollbar-none gap-2 overflow-x-auto px-4 pt-1 pb-3.5"
    >
      {children}
    </div>
  );
}
