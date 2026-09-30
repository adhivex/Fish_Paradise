import { NextResponse } from 'next/server';
import type { z } from 'zod';

/** Error codes from docs/API.md. */
export type ApiErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'INTERNAL';

export type ApiResponse<T> = { data: T } | { error: { code: ApiErrorCode; message: string } };

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, init);
}

export function fail(code: ApiErrorCode, message: string, status: number): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ error: { code, message } }, { status });
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

/** Wraps a route handler so unexpected errors return the `{ error }` envelope with a 500. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error('[api] unhandled error', err);
      return fail('INTERNAL', 'Something went wrong. Please try again.', 500);
    }
  };
}
