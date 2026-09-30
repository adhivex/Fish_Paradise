import 'server-only';
import { env } from '@/lib/env';
import { log } from '@/lib/log';
import { maskPhone } from '@/lib/phone';

/** Sends a one-time code. Implementations must never log the code outside development. */
export interface OtpProvider {
  readonly name: 'console' | 'msg91';
  send(phoneE164: string, code: string): Promise<void>;
}

/** Development: prints the code to the server terminal. */
const consoleProvider: OtpProvider = {
  name: 'console',
  async send(phone, code) {
    console.log(`\n  🐟 OTP for ${phone}: ${code}\n`);
  },
};

/**
 * MSG91 OTP API (v5). Requires a DLT-approved template in India (MSG91_TEMPLATE_ID).
 * https://docs.msg91.com/otp/sendotp
 */
const msg91Provider: OtpProvider = {
  name: 'msg91',
  async send(phone, code) {
    const { MSG91_AUTH_KEY, MSG91_TEMPLATE_ID } = env();
    if (!MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID) throw new Error('MSG91 is not configured');
    const url = new URL('https://control.msg91.com/api/v5/otp');
    url.searchParams.set('template_id', MSG91_TEMPLATE_ID);
    url.searchParams.set('mobile', phone.replace('+', ''));
    url.searchParams.set('otp', code);
    const res = await fetch(url, {
      method: 'POST',
      headers: { authkey: MSG91_AUTH_KEY, 'content-type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(8000),
    });
    const body = (await res.json().catch(() => ({}))) as { type?: string; message?: string };
    if (!res.ok || body.type === 'error') {
      log.error('otp.msg91_failed', { phone: maskPhone(phone), status: res.status, message: body.message });
      throw new Error('Could not send the OTP');
    }
  },
};

export function otpProvider(): OtpProvider {
  return env().OTP_PROVIDER === 'msg91' ? msg91Provider : consoleProvider;
}
