/**
 * Structured JSON logs (one line per event) for payments, webhooks, notifications and errors.
 * Never log secrets, OTP codes, full phone numbers or card data.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

function serializeError(err: unknown) {
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack };
  return { message: String(err) };
}

function write(level: Level, event: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'test' && level === 'debug') return;
  const entry: Record<string, unknown> = { level, event, time: new Date().toISOString() };
  if (data) {
    for (const [k, v] of Object.entries(data)) entry[k] = k === 'err' ? serializeError(v) : v;
  }
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (event: string, data?: Record<string, unknown>) => write('debug', event, data),
  info: (event: string, data?: Record<string, unknown>) => write('info', event, data),
  warn: (event: string, data?: Record<string, unknown>) => write('warn', event, data),
  error: (event: string, data?: Record<string, unknown>) => write('error', event, data),
};
