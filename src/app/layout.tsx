import type { Metadata, Viewport } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import { BottomNav } from '@/components/features/BottomNav';
import { StoreHydration } from '@/components/features/StoreHydration';
import { Toast } from '@/components/ui/Toast';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-fraunces',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Fish Paradise – Fresh seafood delivered', template: '%s · Fish Paradise' },
  description: 'Fresh fish, prawns and crab, cleaned to order and delivered to your door.',
  applicationName: 'Fish Paradise',
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
        <div className="bg-cream relative mx-auto min-h-dvh max-w-[480px] shadow-[0_0_40px_-20px_rgba(10,42,47,0.35)]">
          {children}
          <Toast />
          <BottomNav />
        </div>
        <StoreHydration />
      </body>
    </html>
  );
}
