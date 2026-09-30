'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InlineError } from '@/components/ui/InlineError';
import { Skeleton } from '@/components/ui/Skeleton';
import { api, ClientApiError, fetcher } from '@/lib/client/api';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/lib/stores/ui';

interface Row {
  id: string;
  name: string;
  categoryName: string;
  pricePerKgPaise: number;
  todayAvailable: boolean;
  stockGrams: number | null;
  isActive: boolean;
}

interface Draft {
  price: string; // rupees
  available: boolean;
  stock: string; // kg, blank = not tracked
}

const toDraft = (r: Row): Draft => ({
  price: String(r.pricePerKgPaise / 100),
  available: r.todayAvailable,
  stock: r.stockGrams === null ? '' : String(r.stockGrams / 1000),
});

function parsePrice(s: string): number | null {
  const n = Number(s);
  return s.trim() && Number.isFinite(n) && n >= 1 ? Math.round(n * 100) : null;
}

function parseStock(s: string): number | null | undefined {
  if (!s.trim()) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 1000) : undefined;
}

/**
 * Morning routine (PRD §7): update today's prices, availability and optional stock for every
 * product on one screen, then save everything in one go.
 */
export function CatalogueEditor() {
  const { data, error, isLoading, mutate } = useSWR<{ items: Row[] }>('/api/admin/catalogue', fetcher);
  const showToast = useUiStore((s) => s.showToast);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const rows = useMemo(() => (data?.items ?? []).filter((r) => r.isActive), [data]);
  const draftOf = (r: Row) => drafts[r.id] ?? toDraft(r);
  const set = (r: Row, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [r.id]: { ...draftOf(r), ...patch } }));

  const changes = rows.flatMap((r) => {
    const d = drafts[r.id];
    if (!d) return [];
    const price = parsePrice(d.price);
    const stock = parseStock(d.stock);
    const u: { id: string; pricePerKgPaise?: number; todayAvailable?: boolean; stockGrams?: number | null } =
      { id: r.id };
    if (price !== null && price !== r.pricePerKgPaise) u.pricePerKgPaise = price;
    if (d.available !== r.todayAvailable) u.todayAvailable = d.available;
    if (stock !== undefined && stock !== r.stockGrams) u.stockGrams = stock;
    return Object.keys(u).length > 1 ? [u] : [];
  });
  const invalid = rows.some((r) => {
    const d = drafts[r.id];
    return d && (parsePrice(d.price) === null || parseStock(d.stock) === undefined);
  });

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await api<{ updated: number; priceChanges: number }>('/api/admin/catalogue/bulk', {
        method: 'PATCH',
        body: { updates: changes },
      });
      await mutate();
      setDrafts({});
      showToast(`Saved ${res.updated} product${res.updated === 1 ? '' : 's'} – the shop is updated`);
    } catch (e) {
      setSaveError(e instanceof ClientApiError ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  const q = query.trim().toLowerCase();
  const visible = rows.filter((r) => !q || r.name.toLowerCase().includes(q));
  const groups = [...new Set(visible.map((r) => r.categoryName))];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="m-0 mr-auto font-serif text-2xl font-semibold">Today&apos;s catalogue</h1>
        <Button
          size="md"
          block={false}
          variant="outline"
          onClick={() => rows.forEach((r) => set(r, { available: true }))}
        >
          Mark all available
        </Button>
      </div>
      <p className="text-ink-muted mt-0 mb-3 text-sm">
        Prices are per kg. Leave stock empty if you don&apos;t track it. Changes go live when you save.
      </p>
      <input
        type="search"
        placeholder="Find a product"
        aria-label="Find a product"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-line-strong bg-card mb-4 h-11 w-full rounded-xl border px-3"
      />

      {isLoading && !data ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : error ? (
        <InlineError message={(error as Error).message} onRetry={() => void mutate()} />
      ) : (
        groups.map((g) => (
          <section key={g} className="mb-5" aria-label={g}>
            <h2 className="text-ink-muted mt-0 mb-2 text-xs font-bold tracking-[0.14em] uppercase">{g}</h2>
            <Card className="overflow-hidden">
              <ul className="m-0 list-none p-0">
                {visible
                  .filter((r) => r.categoryName === g)
                  .map((r) => {
                    const d = draftOf(r);
                    const dirty = !!drafts[r.id] && changes.some((c) => c.id === r.id);
                    const priceBad = parsePrice(d.price) === null;
                    const stockBad = parseStock(d.stock) === undefined;
                    return (
                      <li
                        key={r.id}
                        className={cn(
                          'border-line-soft grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 border-t px-3.5 py-3 first:border-t-0 sm:grid-cols-[1fr_110px_100px_auto]',
                          dirty && 'bg-gold-soft/60',
                        )}
                      >
                        <div className="min-w-0">
                          <b className="block truncate">{r.name}</b>
                          <span className={cn('text-xs', d.available ? 'text-success' : 'text-danger')}>
                            {d.available ? 'Available today' : 'Sold out today'}
                          </span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={d.available}
                          aria-label={`${r.name} available today`}
                          onClick={() => set(r, { available: !d.available })}
                          className={cn(
                            'relative h-8 w-14 flex-none rounded-full transition-colors sm:order-last',
                            d.available ? 'bg-success' : 'bg-line-strong',
                          )}
                        >
                          <span
                            className={cn(
                              'absolute top-1 size-6 rounded-full bg-white shadow transition-all',
                              d.available ? 'left-7' : 'left-1',
                            )}
                          />
                        </button>
                        <label className="flex items-center gap-1 text-sm">
                          <span className="text-ink-muted">₹</span>
                          <input
                            inputMode="decimal"
                            aria-label={`${r.name} price per kg in rupees`}
                            aria-invalid={priceBad}
                            value={d.price}
                            onChange={(e) => set(r, { price: e.target.value })}
                            className="border-line-strong bg-card aria-[invalid=true]:border-danger h-11 w-20 rounded-xl border px-2 text-right font-semibold"
                          />
                          <span className="text-ink-muted text-xs">/kg</span>
                        </label>
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            inputMode="decimal"
                            aria-label={`${r.name} stock in kg (optional)`}
                            aria-invalid={stockBad}
                            placeholder="—"
                            value={d.stock}
                            onChange={(e) => set(r, { stock: e.target.value })}
                            className="border-line-strong bg-card aria-[invalid=true]:border-danger h-11 w-16 rounded-xl border px-2 text-right"
                          />
                          <span className="text-ink-muted text-xs">kg</span>
                        </label>
                      </li>
                    );
                  })}
              </ul>
            </Card>
          </section>
        ))
      )}

      {(changes.length > 0 || saveError) && (
        <div className="border-line bg-cream fixed inset-x-0 bottom-0 z-30 border-t px-4 pt-3 pb-[calc(14px+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
            {saveError && <InlineError className="w-full" message={saveError} />}
            <span className="text-sm font-semibold">
              {changes.length} change{changes.length === 1 ? '' : 's'}
            </span>
            <Button
              variant="outline"
              size="md"
              block={false}
              className="ml-auto"
              onClick={() => setDrafts({})}
            >
              Discard
            </Button>
            <Button
              size="md"
              block={false}
              disabled={saving || invalid || changes.length === 0}
              onClick={() => void save()}
            >
              {saving ? 'Saving…' : `Save ${changes.length} change${changes.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
