'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card, Pill } from '@/components/ui/Card';
import { InlineError } from '@/components/ui/InlineError';
import { ProductImage } from '@/components/ui/ProductImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextButton } from '@/components/ui/TextLink';
import { api, ClientApiError, fetcher } from '@/lib/client/api';
import { formatPricePerKg } from '@/lib/money';
import { formatQty } from '@/lib/qty';
import { useUiStore } from '@/lib/stores/ui';
import { AdminCrud } from './AdminCrud';
import { Field, fromFormValue, toFormValue, type FieldDef, type FormValues } from './fields';
import { ImageUpload } from './ImageUpload';

interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  categoryName: string;
  note: string | null;
  description: string | null;
  imageUrl: string | null;
  pricePerKgPaise: number;
  minQtyGrams: number;
  stepGrams: number;
  maxQtyGrams: number;
  todayAvailable: boolean;
  stockGrams: number | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function productFields(categories: Category[]): FieldDef[] {
  return [
    { name: 'name', label: 'Name', type: 'text', placeholder: 'e.g. Pomfret' },
    { name: 'slug', label: 'URL name', type: 'text', help: 'Lowercase, used in the product link' },
    {
      name: 'categoryId',
      label: 'Category',
      type: 'select',
      options: categories.map((c) => ({ value: c.id, label: c.name })),
    },
    { name: 'pricePerKgPaise', label: 'Price per kg', type: 'money' },
    {
      name: 'note',
      label: 'Short note',
      type: 'text',
      nullable: true,
      placeholder: 'e.g. Freshly sourced today',
    },
    { name: 'description', label: 'Description', type: 'textarea', nullable: true },
    { name: 'minQtyGrams', label: 'Minimum quantity', type: 'grams' },
    { name: 'stepGrams', label: 'Quantity step', type: 'grams' },
    { name: 'maxQtyGrams', label: 'Maximum per order', type: 'grams' },
    { name: 'sortOrder', label: 'Sort order', type: 'number', help: 'Lower numbers show first' },
    { name: 'isFeatured', label: "Show in Today's fresh catch", type: 'boolean' },
    { name: 'todayAvailable', label: 'Available today', type: 'boolean' },
    { name: 'isActive', label: 'Visible in the shop', type: 'boolean' },
  ];
}

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const fields = productFields(categories);
  const initial: Record<string, unknown> = product
    ? { ...product }
    : {
        categoryId: categories[0]?.id ?? '',
        minQtyGrams: 500,
        stepGrams: 500,
        maxQtyGrams: 20000,
        sortOrder: 0,
        isFeatured: false,
        todayAvailable: true,
        isActive: true,
      };
  const [values, setValues] = useState<FormValues>(() =>
    Object.fromEntries(fields.map((f) => [f.name, toFormValue(f, initial[f.name])])),
  );
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '');
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const data: Record<string, unknown> = {
        imageUrl: imageUrl || null,
        stockGrams: product?.stockGrams ?? null,
      };
      for (const f of fields) {
        const v = fromFormValue(f, values[f.name] ?? '');
        if (v !== undefined) data[f.name] = v;
      }
      if (product) await api(`/api/admin/products/${product.id}`, { method: 'PATCH', body: data });
      else await api('/api/admin/products', { body: data });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={product ? `Edit ${product.name}` : 'New product'}
      footer={
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save product'}
        </Button>
      }
    >
      <div className="mt-3">
        <ImageUpload value={imageUrl} onChange={setImageUrl} />
        {fields.map((f) => (
          <Field
            key={f.name}
            def={f}
            value={values[f.name] ?? ''}
            onChange={(v) =>
              setValues((s) => {
                const next = { ...s, [f.name]: v };
                if (f.name === 'slug') setSlugTouched(true);
                if (f.name === 'name' && !slugTouched) next.slug = slugify(String(v));
                return next;
              })
            }
          />
        ))}
        {error && <InlineError message={error} />}
      </div>
    </BottomSheet>
  );
}

export function ProductsAdmin() {
  const { data, error, isLoading, mutate } = useSWR<{ items: AdminProduct[] }>(
    '/api/admin/products',
    fetcher,
  );
  const { data: cats } = useSWR<{ items: Category[] }>('/api/admin/categories', fetcher);
  const showToast = useUiStore((s) => s.showToast);
  const [editing, setEditing] = useState<{ product: AdminProduct | null; n: number } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function remove(p: AdminProduct) {
    setActionError(null);
    try {
      const res = await api<{ hidden: boolean }>(`/api/admin/products/${p.id}`, { method: 'DELETE' });
      await mutate();
      showToast(res.hidden ? `${p.name} hidden (it has past orders)` : `${p.name} deleted`);
    } catch (e) {
      setActionError(e instanceof ClientApiError ? e.message : 'Could not delete.');
    } finally {
      setConfirm(null);
    }
  }

  return (
    <div>
      <section className="mb-8" aria-labelledby="products-title">
        <div className="mb-3 flex items-center justify-between">
          <h1 id="products-title" className="m-0 font-serif text-2xl font-semibold">
            Products
          </h1>
          <Button
            size="md"
            block={false}
            disabled={!cats?.items.length}
            onClick={() => setEditing({ product: null, n: Date.now() })}
          >
            Add product
          </Button>
        </div>
        {isLoading && !data ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : error ? (
          <InlineError message={(error as Error).message} onRetry={() => void mutate()} />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {data?.items.map((p) => (
              <li key={p.id}>
                <Card className="flex items-center gap-3 p-3">
                  <ProductImage
                    slug={p.slug}
                    imageUrl={p.imageUrl}
                    className="size-14 rounded-xl"
                    sizes="56px"
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <b className="block truncate">{p.name}</b>
                    <span className="text-ink-muted">
                      {p.categoryName} · {formatPricePerKg(p.pricePerKgPaise)} · {formatQty(p.minQtyGrams)}{' '}
                      min
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {!p.isActive && <Pill tone="danger">Hidden</Pill>}
                      {!p.todayAvailable && <Pill tone="danger">Sold out</Pill>}
                      {p.isFeatured && <Pill tone="gold">Featured</Pill>}
                    </span>
                  </div>
                  <div className="flex flex-col items-end sm:flex-row">
                    <TextButton onClick={() => setEditing({ product: p, n: Date.now() })}>Edit</TextButton>
                    {confirm === p.id ? (
                      <TextButton className="text-danger" onClick={() => void remove(p)}>
                        Confirm
                      </TextButton>
                    ) : (
                      <TextButton className="text-danger" onClick={() => setConfirm(p.id)}>
                        Delete
                      </TextButton>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
        {actionError && <InlineError className="mt-3" message={actionError} />}
      </section>

      <AdminCrud
        title="Categories"
        noun="Category"
        endpoint="/api/admin/categories"
        defaults={{ sortOrder: 0, isActive: true }}
        fields={[
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'slug', label: 'URL name', type: 'text', help: 'Lowercase, e.g. prawns' },
          { name: 'sortOrder', label: 'Sort order', type: 'number' },
          { name: 'isActive', label: 'Visible in the shop', type: 'boolean' },
        ]}
        summary={(c) => (
          <>
            <b>{String(c.name)}</b> <span className="text-ink-muted">/{String(c.slug)}</span>
            {!c.isActive && <span className="text-danger"> · hidden</span>}
          </>
        )}
      />

      <AdminCrud
        title="Cleaning options"
        noun="Option"
        endpoint="/api/admin/cleaning-options"
        defaults={{ extraPaise: 0, sortOrder: 0, isActive: true, isDefault: false, requiresNote: false }}
        fields={[
          { name: 'label', label: 'Label', type: 'text', placeholder: 'e.g. Curry cut' },
          { name: 'extraPaise', label: 'Extra charge', type: 'money', help: '0 = no extra charge' },
          { name: 'sortOrder', label: 'Sort order', type: 'number' },
          { name: 'requiresNote', label: 'Customer must describe the cut', type: 'boolean' },
          { name: 'isDefault', label: 'Default option', type: 'boolean' },
          { name: 'isActive', label: 'Offered', type: 'boolean' },
        ]}
        summary={(o) => (
          <>
            <b>{String(o.label)}</b>
            {o.isDefault ? <span className="text-gold-dark"> · default</span> : null}
            {o.requiresNote ? <span className="text-ink-muted"> · needs note</span> : null}
            {!o.isActive && <span className="text-danger"> · retired</span>}
          </>
        )}
      />

      {editing && (
        <ProductForm
          key={editing.n}
          product={editing.product}
          categories={cats?.items ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            void mutate();
            showToast('Product saved');
          }}
        />
      )}
    </div>
  );
}
