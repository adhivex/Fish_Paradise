import { BottomNav } from '@/components/features/BottomNav';
import { CatalogueProvider } from '@/components/features/CatalogueProvider';
import { getCatalogue } from '@/server/services/catalogue';

/** Customer storefront: 480px mobile shell with the cached catalogue and bottom nav. */
export default async function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalogue = await getCatalogue();
  return (
    <div className="bg-cream relative mx-auto min-h-dvh max-w-[480px] shadow-[0_0_40px_-20px_rgba(10,42,47,0.35)]">
      <CatalogueProvider catalogue={catalogue}>
        {children}
        <BottomNav />
      </CatalogueProvider>
    </div>
  );
}
