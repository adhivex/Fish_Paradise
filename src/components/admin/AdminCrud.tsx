'use client';

import { useState, type ReactNode } from 'react';
import useSWR from 'swr';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InlineError } from '@/components/ui/InlineError';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextButton } from '@/components/ui/TextLink';
import { api, ClientApiError, fetcher } from '@/lib/client/api';
import { useUiStore } from '@/lib/stores/ui';
import { Field, fromFormValue, toFormValue, type FieldDef, type FormValues } from './fields';

type Item = { id: string } & Record<string, unknown>;

/** Sheet with a generated form; submits the converted values. */
export function EntityForm({
  title,
  fields,
  initial,
  open,
  onClose,
  onSubmit,
}: {
  title: string;
  fields: FieldDef[];
  initial: Record<string, unknown> | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [values, setValues] = useState<FormValues>(() =>
    Object.fromEntries(fields.map((f) => [f.name, toFormValue(f, initial?.[f.name])])),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const data: Record<string, unknown> = {};
      for (const f of fields) {
        const v = fromFormValue(f, values[f.name] ?? '');
        if (v !== undefined) data[f.name] = v;
      }
      await onSubmit(data);
      onClose();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <Button onClick={() => void submit()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      }
    >
      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {fields.map((f) => (
          <Field
            key={f.name}
            def={f}
            value={values[f.name] ?? ''}
            onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
          />
        ))}
        {error && <InlineError message={error} />}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </BottomSheet>
  );
}

/** List + create/edit/delete for a simple admin entity backed by `/api/admin/<endpoint>`. */
export function AdminCrud({
  title,
  noun,
  endpoint,
  fields,
  defaults,
  summary,
  deleteHint,
}: {
  title: string;
  noun: string;
  endpoint: string;
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  summary: (item: Item) => ReactNode;
  deleteHint?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR<{ items: Item[] }>(endpoint, fetcher);
  const showToast = useUiStore((s) => s.showToast);
  const [editing, setEditing] = useState<{ item: Item | null; n: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function save(data: Record<string, unknown>) {
    if (editing?.item) await api(`${endpoint}/${editing.item.id}`, { method: 'PATCH', body: data });
    else await api(endpoint, { body: data });
    await mutate();
    showToast(`${noun} saved`);
  }

  async function remove(id: string) {
    setActionError(null);
    try {
      await api(`${endpoint}/${id}`, { method: 'DELETE' });
      await mutate();
      showToast(`${noun} removed`);
    } catch (e) {
      setActionError(e instanceof ClientApiError ? e.message : 'Could not delete.');
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <section aria-labelledby={`${endpoint}-title`} className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 id={`${endpoint}-title`} className="m-0 font-serif text-xl font-semibold">
          {title}
        </h2>
        <Button size="md" block={false} onClick={() => setEditing({ item: null, n: Date.now() })}>
          Add {noun.toLowerCase()}
        </Button>
      </div>
      {deleteHint && <p className="text-ink-muted mt-0 mb-3 text-xs">{deleteHint}</p>}
      {isLoading && !data ? (
        <Skeleton className="h-20 w-full rounded-2xl" />
      ) : error ? (
        <InlineError message={(error as Error).message} onRetry={() => void mutate()} />
      ) : data?.items.length === 0 ? (
        <Card className="text-ink-muted p-4 text-sm">Nothing here yet.</Card>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {data?.items.map((item) => (
            <li key={item.id}>
              <Card className="flex flex-wrap items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1 text-sm">{summary(item)}</div>
                <div className="flex items-center">
                  <TextButton onClick={() => setEditing({ item, n: Date.now() })}>Edit</TextButton>
                  {confirmDelete === item.id ? (
                    <>
                      <TextButton className="text-danger" onClick={() => void remove(item.id)}>
                        Confirm
                      </TextButton>
                      <TextButton onClick={() => setConfirmDelete(null)}>Keep</TextButton>
                    </>
                  ) : (
                    <TextButton className="text-danger" onClick={() => setConfirmDelete(item.id)}>
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
      {editing && (
        <EntityForm
          key={editing.n}
          title={editing.item ? `Edit ${noun.toLowerCase()}` : `New ${noun.toLowerCase()}`}
          fields={fields}
          initial={editing.item ?? defaults}
          open
          onClose={() => setEditing(null)}
          onSubmit={save}
        />
      )}
    </section>
  );
}
