import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useDebounce } from '@/shared/hooks/useDebounce';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  'aria-label'?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  debounceMs = 300,
  'aria-label': ariaLabel = 'Search',
  className,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const debounced = useDebounce(local, debounceMs);

  // Latest-callback ref, refreshed in an effect (never written during render)
  // so the debounced-commit effect below can call the current `onChange`
  // without re-running every time the caller passes a new function identity.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current(debounced);
  }, [debounced]);

  // Resync `local` when the caller resets `value` externally (e.g. "clear
  // all filters"), without the cascading-render effect pattern.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setLocal(value);
  }

  return (
    <div role="search" className={cn('relative flex items-center', className)}>
      <Search
        className="pointer-events-none absolute left-3 h-4 w-4 text-text-muted"
        aria-hidden="true"
      />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-10 w-full rounded-md border border-border-strong bg-bg-card py-2 pl-9 pr-9 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-(--transition-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
      />
      {local && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setLocal('')}
          className="absolute right-3 rounded-sm p-0.5 text-text-muted hover:text-text-primary focus-visible:outline-none"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
