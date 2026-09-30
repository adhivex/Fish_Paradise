'use client';

/** Error from our `{ error: { code, message } }` envelope. */
export class ClientApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ClientApiError';
  }
}

/** fetch + JSON envelope unwrapping. Throws ClientApiError with a customer-friendly message. */
export async function api<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init?.method ?? (init?.body !== undefined ? 'POST' : 'GET'),
      headers: init?.body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw new ClientApiError('NETWORK', 'You seem to be offline. Please check your connection.', 0);
  }
  const json = (await res.json().catch(() => null)) as {
    data?: T;
    error?: { code: string; message: string };
  } | null;
  if (!res.ok || !json || json.error) {
    throw new ClientApiError(
      json?.error?.code ?? 'INTERNAL',
      json?.error?.message ?? 'Something went wrong. Please try again.',
      res.status,
    );
  }
  return json.data as T;
}

export const fetcher = <T>(url: string) => api<T>(url);
