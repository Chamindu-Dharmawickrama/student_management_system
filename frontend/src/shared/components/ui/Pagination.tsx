import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { Select } from './Select';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  meta,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const { page, limit, total, totalPages } = meta;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-text-muted" aria-live="polite">
        {total === 0 ? 'No results' : `Showing ${start}–${end} of ${total}`}
      </p>
      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <Select
            aria-label="Rows per page"
            options={pageSizeOptions.map((size) => ({ value: String(size), label: `${size} / page` }))}
            value={String(limit)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9"
          />
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="px-2 text-sm tabular-nums text-text-secondary">
            Page {page} of {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
