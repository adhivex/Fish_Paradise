'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'money' // edited in rupees, stored in paise
  | 'grams'
  | 'boolean'
  | 'select'
  | 'time'
  | 'datetime'
  | 'bands'; // comma-separated rupee amounts → paise[]

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  /** Empty input → null (instead of a validation error). */
  nullable?: boolean;
}

export type FormValues = Record<string, string | boolean>;

/** Converts a stored value into an editable string/boolean. */
export function toFormValue(def: FieldDef, v: unknown): string | boolean {
  if (def.type === 'boolean') return !!v;
  if (v === null || v === undefined) return '';
  switch (def.type) {
    case 'money':
      return String((v as number) / 100);
    case 'bands':
      return (v as number[]).map((p) => p / 100).join(', ');
    case 'datetime':
      return new Date(v as string).toISOString().slice(0, 16);
    default:
      return String(v);
  }
}

/** Converts form input back to API values: rupees → paise, blanks → null for nullable fields. */
export function fromFormValue(def: FieldDef, v: string | boolean): unknown {
  if (def.type === 'boolean') return !!v;
  const s = String(v).trim();
  if (s === '') return def.nullable ? null : def.type === 'text' || def.type === 'textarea' ? '' : undefined;
  switch (def.type) {
    case 'money':
      return Math.round(Number(s) * 100);
    case 'number':
    case 'grams':
      return Math.round(Number(s));
    case 'bands':
      return s
        .split(',')
        .map((x) => Math.round(Number(x.trim()) * 100))
        .filter((n) => Number.isFinite(n) && n > 0);
    case 'datetime':
      return new Date(s).toISOString();
    default:
      return s;
  }
}

const inputCls =
  'border-line-strong bg-card aria-[invalid=true]:border-danger h-11 w-full rounded-xl border px-3 text-[15px]';

export function Field({
  def,
  value,
  error,
  onChange,
}: {
  def: FieldDef;
  value: string | boolean;
  error?: string;
  onChange: (v: string | boolean) => void;
}) {
  const id = useId();
  const described = error ? `${id}-err` : def.help ? `${id}-help` : undefined;
  let control: ReactNode;
  switch (def.type) {
    case 'boolean':
      return (
        <label className="mb-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            className="accent-ink size-5"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
          {def.label}
          {def.help && <span className="text-ink-muted text-xs font-normal">{def.help}</span>}
        </label>
      );
    case 'textarea':
      control = (
        <textarea
          id={id}
          value={String(value)}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={described}
          className={cn(inputCls, 'h-auto min-h-20 py-2')}
        />
      );
      break;
    case 'select':
      control = (
        <select
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={described}
          className={inputCls}
        >
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    default:
      control = (
        <div className="relative">
          {def.type === 'money' && (
            <span className="text-ink-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
              ₹
            </span>
          )}
          <input
            id={id}
            type={def.type === 'time' ? 'time' : def.type === 'datetime' ? 'datetime-local' : 'text'}
            inputMode={['money', 'number', 'grams'].includes(def.type) ? 'decimal' : undefined}
            value={String(value)}
            placeholder={def.placeholder}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={described}
            className={cn(inputCls, def.type === 'money' && 'pl-7')}
          />
        </div>
      );
  }
  return (
    <div className="mb-3">
      <label htmlFor={id} className="mb-1 block text-[13px] font-semibold">
        {def.label}
        {def.type === 'grams' && <span className="text-ink-muted font-normal"> (grams)</span>}
      </label>
      {control}
      {def.help && !error && (
        <p id={`${id}-help`} className="text-ink-muted mt-1 mb-0 text-xs">
          {def.help}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="text-danger mt-1 mb-0 text-xs font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}
