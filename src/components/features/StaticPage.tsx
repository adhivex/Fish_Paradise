import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

/** Shell for static pages (Offers, Help, About, legal). */
export function StaticPage({
  title,
  children,
  backHref = '/account',
}: {
  title: string;
  children: ReactNode;
  backHref?: string;
}) {
  return (
    <main className="pb-10">
      <PageHeader title={title} backHref={backHref} backLabel="Back" />
      <Card className="[&_p]:text-ink-muted mx-4 mt-2 p-5 text-[15px] leading-relaxed [&_h2]:mt-5 [&_h2]:mb-1.5 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_h2:first-child]:mt-0 [&_p]:my-2">
        {children}
      </Card>
    </main>
  );
}

/** Clearly marked placeholder for business facts the shop must supply. */
export function Placeholder({ children }: { children: ReactNode }) {
  return <span className="bg-gold-soft text-gold-ink rounded px-1.5 py-0.5 font-semibold">{children}</span>;
}
