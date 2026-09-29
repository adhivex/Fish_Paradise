import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

/** Checkout card with the gold number on an ink circle. */
export function SectionCard({
  step,
  title,
  action,
  children,
  className,
}: {
  step: number;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = `section-${step}`;
  return (
    <Card className={cn('mx-4 mt-4 px-4 py-[18px]', className)}>
      <section aria-labelledby={id}>
        <div className="mb-3.5 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="bg-ink text-gold flex size-7 flex-none items-center justify-center rounded-full text-[13px] font-bold"
          >
            {step}
          </span>
          <h2 id={id} className="m-0 font-serif text-[19px] font-semibold">
            {title}
          </h2>
          {action && <div className="ml-auto">{action}</div>}
        </div>
        {children}
      </section>
    </Card>
  );
}
