import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export interface FilterBarProps {
  /** Filter controls — typically SearchInput, Select, Combobox composed together. */
  children: ReactNode;
  chips?: FilterChip[];
  onClearAll?: () => void;
}

/**
 * Presentational filter bar. Pair with `useUrlFilters` in the screen that
 * owns the filter state, so the URL stays the source of truth and views
 * remain shareable / back-button friendly.
 */
export function FilterBar({ children, chips = [], onClearAll }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">{children}</div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-medium text-primary-700"
            >
              {chip.label}
              <button
                type="button"
                aria-label={`Remove filter: ${chip.label}`}
                onClick={chip.onRemove}
                className="rounded-full hover:text-danger focus-visible:outline-none"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          {onClearAll && (
            <Button variant="link" size="sm" onClick={onClearAll}>
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
