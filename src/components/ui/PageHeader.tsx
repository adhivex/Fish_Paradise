import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { IconLink } from './IconButton';

interface PageHeaderProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  className?: string;
  /** Sticky headers stay visible while the page scrolls. */
  sticky?: boolean;
}

export function PageHeader({
  title,
  backHref,
  backLabel = 'Back',
  actions,
  className,
  sticky = true,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'bg-cream flex flex-none items-center gap-1 px-3 pt-3 pb-2',
        sticky && 'sticky top-0 z-20',
        className,
      )}
    >
      {backHref && <IconLink href={backHref} icon="arrowLeft" label={backLabel} />}
      <h1
        className={cn(
          'm-0 flex-1 truncate font-serif text-2xl font-semibold tracking-[-0.3px]',
          !backHref && 'pl-1',
        )}
      >
        {title}
      </h1>
      {actions}
    </header>
  );
}

/** Serif section title with an optional "View all" style link on the right. */
export function SectionHeader({ title, action, id }: { title: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mx-4 mt-[30px] mb-3 flex items-end justify-between">
      <h2 id={id} className="m-0 font-serif text-2xl font-semibold tracking-[-0.4px]">
        {title}
      </h2>
      {action}
    </div>
  );
}

/** Sticky bottom action bar with safe-area padding. */
export function StickyDock({ children }: { children: ReactNode }) {
  return (
    <div className="border-line bg-cream fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t px-4 pt-3.5 pb-[calc(18px+env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}
