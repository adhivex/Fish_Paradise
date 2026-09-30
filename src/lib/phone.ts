/**
 * Indian mobile numbers. Stored as E.164 (`+919876543210`); customers may type
 * `98765 43210`, `+91 98765-43210`, `09876543210` or `919876543210`.
 */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/[\s\-()]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91${digits}`;
}

/** `+919876543210` → `+91 98765 43210` */
export function formatPhone(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}

/** `+919876543210` → `+91 ••••• •3210` for logs and messages. */
export function maskPhone(e164: string): string {
  return e164.length > 4 ? `${e164.slice(0, 3)} ••••• •${e164.slice(-4)}` : '••••';
}
