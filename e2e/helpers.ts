import type { APIRequestContext, Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

/** A fresh valid Indian mobile number per test, so OTP rate limits never collide. */
export function randomPhone(): string {
  return `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;
}

let prisma: PrismaClient | undefined;
function db() {
  prisma ??= new PrismaClient();
  return prisma;
}

/** Creates an ADMIN user for a phone (test database only) before it logs in. */
export async function makeAdmin(phone: string): Promise<void> {
  const e164 = `+91${phone}`;
  await db().user.upsert({
    where: { phone: e164 },
    update: { role: 'ADMIN' },
    create: { phone: e164, role: 'ADMIN' },
  });
}

/** Logs in through the real OTP endpoints (console provider returns the code in dev). */
export async function apiLogin(request: APIRequestContext, phone: string): Promise<void> {
  const res = await request.post('/api/auth/otp/request', { data: { phone } });
  const body = (await res.json()) as { data?: { devCode?: string }; error?: { message: string } };
  if (!body.data?.devCode) throw new Error(`OTP request failed: ${JSON.stringify(body)}`);
  const verify = await request.post('/api/auth/otp/verify', { data: { phone, code: body.data.devCode } });
  if (!verify.ok()) throw new Error(`OTP verify failed: ${await verify.text()}`);
}

/** Types the code shown by the dev-mode hint into the login form. */
export async function completeLoginForm(page: Page, phone: string): Promise<void> {
  await page.getByLabel('Mobile number').fill(phone);
  await page.getByRole('button', { name: 'Send code' }).click();
  const hint = await page.getByText(/Development mode: your code is/).textContent();
  const code = hint?.match(/(\d{6})/)?.[1];
  if (!code) throw new Error('No dev code shown');
  await page.getByLabel('6-digit code').fill(code);
}
