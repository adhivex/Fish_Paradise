import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fish Paradise – Fresh seafood delivered',
    short_name: 'Fish Paradise',
    description: 'Fresh fish, prawns and crab, cleaned to order and delivered to your door.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F7F2E8',
    theme_color: '#0A2A2F',
    lang: 'en-IN',
    categories: ['food', 'shopping'],
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Shop', url: '/shop' },
      { name: 'My orders', url: '/orders' },
    ],
  };
}
