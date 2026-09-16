import {
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Check, ChevronDown, AlertCircle, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useClickOutside } from '@/shared/hooks/useClickOutside';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  emptyMessage?: string;
  id?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  label,
  hint,
  error,
  placeholder = 'Search…',
  required,
  disabled,
  clearable = true,
  emptyMessage = 'No matches found',
  id,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const generatedId = useId();
  const comboId = id ?? generatedId;
  const listboxId = `${comboId}-listbox`;
  const hintId = hint ? `${comboId}-hint` : undefined;
  const errorId = error ? `${comboId}-error` : undefined;

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useClickOutside(containerRef, () => {
    setOpen(false);
    setQuery('');
  });

  function openList() {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(0);
  }

  function selectOption(option: ComboboxOption) {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    setQuery('');
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (open && option) selectOption(option);
    } else if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setQuery('');
      }
    }
  }

  const activeOptionId =
    open && filtered[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={comboId} className="text-sm font-medium text-text-primary">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={comboId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-invalid={!!error || undefined}
          aria-describedby={cn(hintId, errorId) || undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={selected ? selected.label : placeholder}
          value={open ? query : ''}
          onFocus={openList}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            if (!open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'h-10 w-full rounded-md border bg-bg-card px-3 pr-16 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-(--transition-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-bg-subtle disabled:text-text-muted',
            error ? 'border-danger' : 'border-border-strong',
          )}
        />
        {!open && selected && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-text-primary">
            {selected.label}
          </span>
        )}
        <div className="absolute right-2 flex items-center gap-1 top-1/2 -translate-y-1/2">
          {clearable && selected && !disabled && (
            <button
              type="button"
              aria-label="Clear selection"
              onClick={() => {
                onChange(null);
                setQuery('');
              }}
              className="rounded-sm p-0.5 text-text-muted hover:text-text-primary focus-visible:outline-none"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 text-text-muted" aria-hidden="true" />
        </div>

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={label ?? placeholder}
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-bg-card py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-muted">{emptyMessage}</li>
            ) : (
              filtered.map((option, index) => (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm',
                    option.disabled && 'cursor-not-allowed text-text-muted',
                    !option.disabled && index === activeIndex && 'bg-primary-subtle',
                    !option.disabled && option.value === value && 'font-medium text-primary',
                  )}
                >
                  {option.label}
                  {option.value === value && (
                    <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {error ? (
        <p id={errorId} className="flex items-center gap-1 text-sm text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
