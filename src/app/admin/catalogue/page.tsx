import type { Metadata } from 'next';
import { CatalogueEditor } from '@/components/admin/CatalogueEditor';

export const metadata: Metadata = { title: "Today's catalogue" };

export default function AdminCataloguePage() {
  return <CatalogueEditor />;
}
