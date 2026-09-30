'use client';

import { useId, useState } from 'react';
import { api, ClientApiError } from '@/lib/client/api';

interface SignedUpload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/** Direct browser → Cloudinary upload with server-signed params. Falls back to pasting a URL. */
export function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('Please choose an image under 8 MB.');
      const s = await api<SignedUpload>('/api/admin/uploads/sign', { body: {} });
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', s.apiKey);
      form.append('timestamp', String(s.timestamp));
      form.append('folder', s.folder);
      form.append('signature', s.signature);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, {
        method: 'POST',
        body: form,
      });
      const json = (await res.json()) as { secure_url?: string; error?: { message: string } };
      if (!res.ok || !json.secure_url) throw new Error(json.error?.message ?? 'Upload failed.');
      onChange(json.secure_url);
    } catch (e) {
      setError(e instanceof ClientApiError || e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-3">
      <span className="mb-1 block text-[13px] font-semibold">Photo</span>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary URL
          <img src={value} alt="" className="size-16 rounded-xl object-cover" />
        ) : (
          <span className="bg-line-soft text-ink-muted flex size-16 items-center justify-center rounded-xl text-xs">
            No photo
          </span>
        )}
        <label
          htmlFor={id}
          className="border-line-strong flex h-11 cursor-pointer items-center rounded-xl border px-3 text-sm font-semibold"
        >
          {busy ? 'Uploading…' : 'Upload photo'}
        </label>
        <input
          id={id}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = '';
          }}
        />
        {value && (
          <button
            type="button"
            className="text-danger h-11 px-2 text-sm font-semibold"
            onClick={() => onChange('')}
          >
            Remove
          </button>
        )}
      </div>
      <input
        aria-label="Photo URL"
        placeholder="…or paste an image URL"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        className="border-line-strong bg-card mt-2 h-10 w-full rounded-xl border px-3 text-sm"
      />
      {error && <p className="text-danger mt-1 mb-0 text-xs font-semibold">{error}</p>}
    </div>
  );
}
