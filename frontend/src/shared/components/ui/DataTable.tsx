import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useMediaQuery, BREAKPOINTS } from '@/shared/hooks/useMediaQuery';
import { Checkbox } from './Checkbox';
import { SkeletonTable } from './Skeleton';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  hideOnMobile?: boolean;
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  getRowId: (row: T) => string;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  stickyHeader?: boolean;
  caption?: string;
}

function cellValue<T>(column: Column<T>, row: T): ReactNode {
  if (column.render) return column.render(row);
  const value = (row as Record<string, unknown>)[column.key];
  return value === null || value === undefined ? '—' : String(value);
}

const ALIGN_CLASSES: Record<NonNullable<Column<unknown>['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function DataTable<T>({
  columns,
  rows,
  isLoading = false,
  error,
  onRetry,
  emptyState,
  onRowClick,
  getRowId,
  sort,
  onSortChange,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  stickyHeader = false,
  caption = 'Data table',
}: DataTableProps<T>) {
  const isMobile = !useMediaQuery(BREAKPOINTS.md);

  if (isLoading) {
    return <SkeletonTable columns={columns.length + (selectable ? 1 : 0)} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (rows.length === 0) {
    return emptyState ?? <EmptyState title="No records found" />;
  }

  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(getRowId(row)));
  const someSelected = !allSelected && rows.some((row) => selectedIds.includes(getRowId(row)));

  function toggleAll() {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : rows.map(getRowId));
  }

  function toggleOne(id: string) {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id],
    );
  }

  function handleSort(column: Column<T>) {
    if (!column.sortable || !onSortChange) return;
    const direction: SortState['direction'] =
      sort?.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ key: column.key, direction });
  }

  if (isMobile) {
    return (
      <ul className="flex flex-col gap-3">
        {rows.map((row) => {
          const id = getRowId(row);
          return (
            <li
              key={id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter') onRowClick(row);
                    }
                  : undefined
              }
              className={cn(
                'rounded-lg border border-border bg-bg-card p-4',
                onRowClick && 'cursor-pointer focus-visible:outline-none',
              )}
            >
              {selectable && (
                <div className="mb-2">
                  <Checkbox
                    checked={selectedIds.includes(id)}
                    onChange={() => toggleOne(id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Select row"
                  />
                </div>
              )}
              <dl className="space-y-2">
                {columns
                  .filter((c) => !c.hideOnMobile)
                  .map((column) => (
                    <div key={column.key} className="flex items-baseline justify-between gap-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                        {column.header}
                      </dt>
                      <dd className="text-right text-sm text-text-primary">
                        {cellValue(column, row)}
                      </dd>
                    </div>
                  ))}
              </dl>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-max border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
          <tr className="bg-bg-subtle">
            {selectable && (
              <th scope="col" className="w-10 px-3 py-2.5">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => {
              const activeSort = sort && sort.key === column.key ? sort : undefined;
              return (
                <th
                  key={column.key}
                  scope="col"
                  style={{ width: column.width }}
                  aria-sort={
                    column.sortable
                      ? activeSort
                        ? activeSort.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                  className={cn(
                    'whitespace-nowrap px-3 py-2.5 font-semibold text-text-secondary',
                    ALIGN_CLASSES[column.align ?? 'left'],
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column)}
                      className="inline-flex items-center gap-1 focus-visible:outline-none"
                    >
                      {column.header}
                      {activeSort ? (
                        activeSort.direction === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const id = getRowId(row);
            return (
              <tr
                key={id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter') onRowClick(row);
                      }
                    : undefined
                }
                className={cn(
                  onRowClick && 'cursor-pointer hover:bg-bg-subtle focus-visible:outline-none',
                )}
              >
                {selectable && (
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(id)}
                      onChange={() => toggleOne(id)}
                      aria-label="Select row"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn('px-3 py-2.5 text-text-primary', ALIGN_CLASSES[column.align ?? 'left'])}
                  >
                    {cellValue(column, row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
