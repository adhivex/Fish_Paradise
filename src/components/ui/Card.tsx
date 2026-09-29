import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card border-line bg-card shadow-card border', className)} {...rest} />;
}

/** Small gold count bubble (cart, active filters). */
export function Badge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'bg-gold text-ink flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px] text-[11px] font-bold',
        className,
      )}
    >
      {count}
    </span>
  );
}

type PillTone = 'gold' | 'success' | 'danger';

const PILL: Record<PillTone, string> = {
  gold: 'bg-gold-soft text-gold-ink',
  success: 'bg-success-soft text-success',
  danger: 'bg-[#F6E1DA] text-danger',
};

/** Status pill, e.g. "Preparing" / "Delivered". */
export function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-[26px] items-center rounded-full px-3 text-xs font-bold tracking-[0.03em]',
        PILL[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Info badge with a check, e.g. "Freshly sourced today". */
export function InfoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gold-soft text-gold-ink inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold">
      <svg
        viewBox="0 0 24 24"
        width={16}
        height={16}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
      {children}
    </span>
  );
}

/** Uppercase eyebrow label. */
export function Eyebrow({
  children,
  className,
  as: Tag = 'p',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'h2' | 'h3';
}) {
  return (
    <Tag className={cn('text-ink-muted m-0 mb-3 text-xs font-bold tracking-[0.14em] uppercase', className)}>
      {children}
    </Tag>
  );
}
