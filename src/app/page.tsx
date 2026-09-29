import Link from 'next/link';
import { CartButton } from '@/components/features/CartButton';
import { ProductCard } from '@/components/features/ProductCards';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconLink } from '@/components/ui/IconButton';
import { SectionHeader } from '@/components/ui/PageHeader';
import { ProductImage } from '@/components/ui/ProductImage';
import { TextLink } from '@/components/ui/TextLink';
import {
  categories,
  categoryCover,
  featuredOrder,
  getProduct,
  products,
  shopSettings,
} from '@/lib/mock/catalogue';

const FEATURES: ReadonlyArray<{ icon: IconName; label: string }> = [
  { icon: 'fish', label: 'Fresh catch daily' },
  { icon: 'drop', label: 'Hygienic cleaning' },
  { icon: 'truck', label: 'Fast delivery' },
  { icon: 'shieldCheck', label: 'Trusted quality' },
];

const FISH_PATH = 'M2 20C12 6 30 4 46 16l16-10v28L46 24C30 36 12 34 2 20z';

function Hero() {
  return (
    <section className="bg-ink text-cream relative overflow-hidden rounded-b-[34px] pt-1.5 pb-[60px]">
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 390 420"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {[290, 330, 370].map((y) => (
          <path
            key={y}
            d={`M0 ${y} Q49 ${y - 22} 98 ${y} T195 ${y} T292 ${y} T390 ${y}`}
            fill="none"
            stroke="rgba(201,164,92,.22)"
            strokeWidth="2"
          />
        ))}
      </svg>
      <svg
        className="absolute -right-[70px] bottom-11 w-[270px] -rotate-12"
        viewBox="0 0 64 40"
        aria-hidden="true"
      >
        <path d={FISH_PATH} fill="none" stroke="#C9A45C" strokeOpacity=".4" strokeWidth=".5" />
        <path
          d="M14 10c-3 6-3 14 0 20M22 8c-3 7-3 17 0 24M30 8c-2 8-2 16 0 24"
          fill="none"
          stroke="#C9A45C"
          strokeOpacity=".25"
          strokeWidth=".4"
        />
      </svg>

      <div className="relative z-[1] flex items-center gap-1 px-3 pt-3 pb-2">
        <IconLink
          href="/account"
          icon="menu"
          label="Open account menu"
          className="text-white hover:bg-white/10"
        />
        <div className="flex flex-1 items-center gap-2.5 text-xl font-semibold tracking-[-0.2px]">
          <span
            className="bg-gold flex size-[34px] items-center justify-center rounded-full"
            aria-hidden="true"
          >
            <svg viewBox="0 0 64 40" className="h-auto w-5">
              <path d={FISH_PATH} fill="#0A2A2F" />
            </svg>
          </span>
          <span className="font-serif">{shopSettings.shopName}</span>
        </div>
        <CartButton className="text-white hover:bg-white/10" />
      </div>

      <Link
        href="/account/addresses"
        className="border-gold/45 text-cream relative z-[1] mx-4 mt-1 inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium hover:bg-white/5"
      >
        <Icon name="pin" className="text-gold" />
        Deliver to {shopSettings.cityLabel}
        <Icon name="chevronDown" className="text-gold" />
      </Link>

      <p className="text-gold relative z-[1] mx-4 mt-7 mb-0 text-xs font-semibold tracking-[0.18em] uppercase">
        Fresh from the coast
      </p>
      <h1 className="relative z-[1] mx-4 mt-2.5 mb-3 font-serif text-[42px] leading-[1.04] font-semibold tracking-[-1px]">
        Fresh Seafood.
        <br />
        Delivered to
        <br />
        Your Door.
      </h1>
      <p className="text-cream/80 relative z-[1] mx-4 mt-0 mb-[26px] max-w-[240px] text-sm leading-relaxed">
        Freshly sourced · Cleaned to order · Fast local delivery
      </p>
      <Link
        href="/shop"
        className="bg-gold text-ink relative z-[1] mx-4 inline-flex h-[52px] items-center gap-2.5 rounded-full px-7 text-[15px] font-semibold tracking-[0.03em] hover:bg-[#d3b06a]"
      >
        Shop now
        <Icon name="arrowRight" />
      </Link>
    </section>
  );
}

export default function HomePage() {
  const featured = featuredOrder
    .map((slug) => products.find((p) => p.slug === slug && p.isFeatured))
    .filter((p) => p !== undefined);

  return (
    <main className="pb-[calc(96px+env(safe-area-inset-bottom))]">
      <Hero />

      <Card className="relative z-[2] mx-4 -mt-8 grid grid-cols-4 px-1 py-4">
        <h2 className="sr-only">Why Fish Paradise</h2>
        {FEATURES.map((f, i) => (
          <div
            key={f.label}
            className={`flex flex-col items-center gap-2 px-1 text-center text-xs leading-tight font-semibold ${i > 0 ? 'border-line-soft border-l' : ''}`}
          >
            <span className="border-gold text-ink flex size-[46px] items-center justify-center rounded-full border">
              <Icon name={f.icon} />
            </span>
            {f.label}
          </div>
        ))}
      </Card>

      <section aria-labelledby="cat-title">
        <SectionHeader
          id="cat-title"
          title="Shop by category"
          action={
            <TextLink href="/shop" chevron>
              View all
            </TextLink>
          }
        />
        <ul className="m-0 grid list-none grid-cols-3 gap-2.5 px-4">
          {categories.map((c) => {
            const cover = getProduct(categoryCover[c.slug] ?? '');
            return (
              <li key={c.id}>
                <Link
                  href={`/shop?category=${c.slug}`}
                  className="flex flex-col items-center gap-2.5 rounded-[20px] text-sm font-semibold tracking-[0.02em]"
                >
                  <ProductImage
                    slug={cover?.slug ?? c.slug}
                    categorySlug={c.slug}
                    className="h-[92px] w-full rounded-[20px]"
                  />
                  {c.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="catch-title">
        <SectionHeader
          id="catch-title"
          title="Today's fresh catch"
          action={
            <TextLink href="/shop" chevron>
              See all
            </TextLink>
          }
        />
        <ul className="m-0 flex scrollbar-none list-none gap-3 overflow-x-auto px-4 pb-2">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </ul>
      </section>
    </main>
  );
}
