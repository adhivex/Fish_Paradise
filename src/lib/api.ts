import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { log } from '@/lib/log';

/** Error codes from docs/API.md. */
export type ApiErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'INTERNAL'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'OTP_RATE_LIMITED'
  | 'OTP_TOO_MANY_ATTEMPTS'
  | 'RATE_LIMITED'
  | 'SOLD_OUT'
  | 'QTY_INVALID'
  | 'CART_EMPTY'
  | 'PINCODE_UNSERVICEABLE'
  | 'MIN_ORDER_NOT_MET'
  | 'SLOT_FULL'
  | 'SLOT_INVALID'
  | 'SHOP_CLOSED'
  | 'COUPON_INVALID'
  | 'INVALID_TRANSITION'
  | 'CANCEL_NOT_ALLOWED'
  | 'PAYMENT_FAILED'
  | 'CONFLICT';

export type ApiResponse<T> = { data: T } | { error: { code: ApiErrorCode; message: string } };

/** Throw from services/handlers; `handle()` turns it into the error envelope. */
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status = 400,
    readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, init);
}

export function fail(
  code: ApiErrorCode,
  message: string,
  status: number,
  headers?: Record<string, string>,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

/** Parses URL search params with a Zod schema; repeated keys keep the first value. */
export function parseSearchParams<S extends z.ZodType>(
  schema: S,
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): z.ZodSafeParseResult<z.infer<S>> {
  const entries: Record<string, string> = {};
  if (params instanceof URLSearchParams) {
    for (const [k, v] of params) entries[k] ??= v;
  } else {
    for (const [k, v] of Object.entries(params)) {
      const first = Array.isArray(v) ? v[0] : v;
      if (first !== undefined) entries[k] = first;
    }
  }
  return schema.safeParse(entries);
}

export function validationMessage(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ');
}

/** Reads and validates a JSON body; throws a VALIDATION ApiError on bad input. */
export async function parseJson<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError('VALIDATION', 'Request body must be JSON');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiError('VALIDATION', validationMessage(parsed.error));
  return parsed.data;
}

/** Wraps a route handler so thrown errors become the `{ error }` envelope. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return fail(err.code, err.message, err.status, err.headers);
      log.error('api.unhandled', { err });
      return fail('INTERNAL', 'Something went wrong. Please try again.', 500);
    }
  };
}

/** Best-effort client IP for rate limiting (first hop of X-Forwarded-For on Vercel/proxies). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}
