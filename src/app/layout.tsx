import type { Metadata, Viewport } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import { CartSync } from '@/components/features/CartSync';
import { ServiceWorker } from '@/components/features/ServiceWorker';
import { StoreHydration } from '@/components/features/StoreHydration';
import { Toast } from '@/components/ui/Toast';
import './globals.css';

// Variable fonts: one file per family instead of one per weight.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const description = 'Fresh fish, prawns and crab, cleaned to order and delivered to your door.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: { default: 'Fish Paradise – Fresh seafood delivered', template: '%s · Fish Paradise' },
  description,
  applicationName: 'Fish Paradise',
  appleWebApp: { capable: true, title: 'Fish Paradise', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'Fish Paradise',
    locale: 'en_IN',
    title: 'Fish Paradise – Fresh seafood delivered',
    description,
  },
  twitter: { card: 'summary_large_image', title: 'Fish Paradise', description },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A2A2F',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body>
        {children}
        <Toast />
        <StoreHydration />
        <CartSync />
        <ServiceWorker />
      </body>
    </html>
  );
}
