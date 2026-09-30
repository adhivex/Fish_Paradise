'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TextButton } from '@/components/ui/TextLink';
import { api, ClientApiError } from '@/lib/client/api';
import { useSession, type ClientUser } from '@/lib/client/session';
import { formatPhone } from '@/lib/phone';

interface RequestResult {
  phone: string;
  expiresInSec: number;
  resendAfterSec: number;
  devCode?: string;
}

/** Phone number → 6-digit code. Calls `onDone` once the session cookie is set. */
export function LoginForm({ onDone }: { onDone: (user: ClientUser) => void }) {
  const { setUser } = useSession();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [sentTo, setSentTo] = useState<RequestResult | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);
  const ids = { phone: useId(), code: useId(), err: useId() };

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function requestCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<RequestResult>('/api/auth/otp/request', { body: { phone } });
      setSentTo(res);
      setStep('code');
      setCode('');
      setWait(res.resendAfterSec);
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Could not send the code.');
    } finally {
      setBusy(false);
    }
  }

  async function verify(value = code) {
    if (!sentTo || value.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const { user } = await api<{ user: ClientUser }>('/api/auth/otp/verify', {
        body: { phone: sentTo.phone, code: value },
      });
      await setUser(user);
      onDone(user);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Could not verify the code.');
      setCode('');
      codeRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  const input =
    'h-14 w-full rounded-2xl border border-line-strong bg-card px-4 text-lg font-semibold tracking-wide text-ink aria-[invalid=true]:border-danger';

  if (step === 'phone') {
    return (
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void requestCode();
        }}
      >
        <label htmlFor={ids.phone} className="mb-2 block text-sm font-semibold">
          Mobile number
        </label>
        <div className="flex items-center gap-2">
          <span className="border-line-strong bg-card flex h-14 items-center rounded-2xl border px-3.5 text-lg font-semibold">
            +91
          </span>
          <input
            id={ids.phone}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 12))}
            aria-invalid={!!error}
            aria-describedby={error ? ids.err : undefined}
            className={input}
          />
        </div>
        <p className="text-ink-muted mt-2 mb-4 text-[13px]">We&apos;ll send a 6-digit code by SMS.</p>
        {error && (
          <p id={ids.err} role="alert" className="text-danger mt-0 mb-3 text-sm font-semibold">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy || phone.replace(/\D/g, '').length < 10}>
          {busy ? 'Sending…' : 'Send code'}
        </Button>
      </form>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void verify();
      }}
    >
      <p className="text-ink-muted mt-0 mb-4 text-sm">
        Enter the code sent to <b className="text-ink">{sentTo ? formatPhone(sentTo.phone) : ''}</b>{' '}
        <TextButton onClick={() => setStep('phone')} className="h-auto">
          Change
        </TextButton>
      </p>
      <label htmlFor={ids.code} className="mb-2 block text-sm font-semibold">
        6-digit code
      </label>
      <input
        id={ids.code}
        ref={codeRef}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        value={code}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 6);
          setCode(v);
          if (v.length === 6) void verify(v);
        }}
        aria-invalid={!!error}
        aria-describedby={error ? ids.err : undefined}
        className={`${input} text-center tracking-[0.5em]`}
      />
      {sentTo?.devCode && (
        <p className="bg-gold-soft text-gold-ink mt-2 mb-0 rounded-lg px-3 py-2 text-[13px]">
          Development mode: your code is <b>{sentTo.devCode}</b> (also printed in the server terminal).
        </p>
      )}
      {error && (
        <p id={ids.err} role="alert" className="text-danger mt-3 mb-0 text-sm font-semibold">
          {error}
        </p>
      )}
      <Button type="submit" className="mt-4" disabled={busy || code.length !== 6}>
        {busy ? 'Checking…' : 'Verify & continue'}
      </Button>
      <div className="mt-2 flex justify-center">
        <TextButton onClick={() => void requestCode()} disabled={wait > 0 || busy}>
          {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
        </TextButton>
      </div>
    </form>
  );
}
