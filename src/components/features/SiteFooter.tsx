import Link from 'next/link';
import type { ShopSettingsDTO } from '@/lib/types';

const LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/refund-policy', label: 'Refunds & cancellation' },
];

/** Legal links and licence line (FSSAI shown only once the owner has entered it). */
export function SiteFooter({ shop }: { shop: ShopSettingsDTO }) {
  return (
    <footer className="text-ink-muted border-line mx-4 mt-10 border-t pt-5 text-[13px]">
      <nav aria-label="Legal">
        <ul className="m-0 flex list-none flex-wrap gap-x-1 p-0">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:underline"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-2 mb-0 px-2">
        © {new Date().getFullYear()} {shop.shopName}
        {shop.fssaiNumber ? ` · FSSAI Lic. No. ${shop.fssaiNumber}` : ''}
      </p>
    </footer>
  );
}
