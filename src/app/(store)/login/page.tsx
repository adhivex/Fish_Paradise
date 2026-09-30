import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginScreen } from '@/components/features/auth/LoginScreen';

export const metadata: Metadata = { title: 'Log in', robots: { index: false } };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  );
}
