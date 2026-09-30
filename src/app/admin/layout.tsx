import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { formatPhone } from '@/lib/phone';
import { currentUser } from '@/server/auth';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin · Fish Paradise' },
  robots: { index: false, follow: false },
};

/** Admin shell. The proxy gates /admin by role; this re-checks against the database (rule 6). */
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'ADMIN') redirect('/');
  return (
    <div className="bg-cream min-h-dvh">
      <AdminNav name={user.name ?? formatPhone(user.phone)} />
      <main className="mx-auto max-w-3xl px-4 pt-4 pb-24">{children}</main>
    </div>
  );
}
