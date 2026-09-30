'use client';

import { BottomSheet } from '@/components/ui/BottomSheet';
import type { ClientUser } from '@/lib/client/session';
import { LoginForm } from './LoginForm';

/** Login in a bottom sheet (used at checkout so the customer never loses their place). */
export function LoginSheet({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (user: ClientUser) => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Log in to continue">
      <p className="text-ink-muted mt-1 mb-5 text-sm">Use your mobile number. Your cart stays as it is.</p>
      <div className="pb-4">{open && <LoginForm onDone={onDone} />}</div>
    </BottomSheet>
  );
}
