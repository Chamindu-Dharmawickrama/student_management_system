import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, AlertCircle, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useClickOutside } from '@/shared/hooks/useClickOutside';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  max?: number;
  id?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  label,
  hint,
  error,
  placeholder = 'Search…',
  required,
  disabled,
  max,
  id,
}: MultiSelectProps) {
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

  const selectedOptions = options.filter((o) => value.includes(o.value));
  const atMax = typeof max === 'number' && value.length >= max;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    return base;
  }, [options, query]);

  useClickOutside(containerRef, () => {
    setOpen(false);
    setQuery('');
  });

  function toggleOption(option: MultiSelectOption) {
    if (option.disabled) return;
    const isSelected = value.includes(option.value);
    if (isSelected) {
      onChange(value.filter((v) => v !== option.value));
    } else {
      if (atMax) return;
      onChange([...value, option.value]);
    }
    inputRef.current?.focus();
  }

  function removeValue(v: string) {
    onChange(value.filter((item) => item !== v));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (open && option) toggleOption(option);
    } else if (event.key === 'Backspace' && query === '' && selectedOptions.length > 0) {
      removeValue(selectedOptions[selectedOptions.length - 1].value);
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
        <div
          className={cn(
            'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border bg-bg-card px-2 py-1.5 transition-colors duration-(--transition-fast) focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1',
            error ? 'border-danger' : 'border-border-strong',
            disabled && 'cursor-not-allowed bg-bg-subtle',
          )}
          onClick={() => !disabled && inputRef.current?.focus()}
        >
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 rounded-full bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary-700"
            >
              {option.label}
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Remove ${option.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeValue(option.value);
                  }}
                  className="rounded-full hover:text-danger focus-visible:outline-none"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </span>
          ))}
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
            placeholder={selectedOptions.length === 0 ? placeholder : ''}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="min-w-20 flex-1 border-0 bg-transparent p-1 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none disabled:cursor-not-allowed"
          />
          <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
        </div>

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            aria-label={label ?? placeholder}
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-bg-card py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-muted">No matches found</li>
            ) : (
              filtered.map((option, index) => {
                const isSelected = value.includes(option.value);
                const isDisabled = option.disabled || (!isSelected && atMax);
                return (
                  <li
                    key={option.value}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled || undefined}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => toggleOption(option)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm',
                      isDisabled && 'cursor-not-allowed text-text-muted',
                      !isDisabled && index === activeIndex && 'bg-primary-subtle',
                      !isDisabled && isSelected && 'font-medium text-primary',
                    )}
                  >
                    {option.label}
                    {isSelected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  </li>
                );
              })
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
