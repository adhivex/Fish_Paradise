'use client';

import { Icon } from './Icon';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
}

export function SearchInput({ value, onChange, placeholder, label }: SearchInputProps) {
  return (
    <label className="border-line-strong bg-card text-ink-muted has-[:focus-visible]:outline-gold-dark mx-4 mt-0.5 mb-3 flex h-[50px] flex-none items-center gap-2.5 rounded-full border px-[18px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
      <Icon name="search" />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        enterKeyHint="search"
        autoComplete="off"
        className="text-ink placeholder:text-ink-muted min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="hover:bg-ink/5 -mr-3 flex size-11 items-center justify-center rounded-full"
        >
          <Icon name="close" size={18} />
        </button>
      )}
    </label>
  );
}
