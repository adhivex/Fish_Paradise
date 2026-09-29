import type { Metadata } from 'next';
import { FavouritesScreen } from '@/components/features/account/FavouritesScreen';

export const metadata: Metadata = { title: 'Favourites' };

export default function FavouritesPage() {
  return <FavouritesScreen />;
}
