import { AlertCircle } from 'lucide-react';
import { DatePicker } from './DatePicker';

export interface DateRangePickerProps {
  label?: string;
  /** ISO "YYYY-MM-DD" values. */
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  error?: string;
  startLabel?: string;
  endLabel?: string;
}

export function DateRangePicker({
  label,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  min,
  max,
  required,
  error,
  startLabel = 'Start date',
  endLabel = 'End date',
}: DateRangePickerProps) {
  const crossFieldError =
    !error && startValue && endValue && startValue >= endValue
      ? 'Start date must be before end date'
      : undefined;
  const effectiveError = error ?? crossFieldError;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-text-primary">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </span>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DatePicker
          label={startLabel}
          value={startValue}
          onChange={(e) => onStartChange(e.target.value)}
          min={min}
          max={endValue || max}
          required={required}
        />
        <DatePicker
          label={endLabel}
          value={endValue}
          onChange={(e) => onEndChange(e.target.value)}
          min={startValue || min}
          max={max}
          required={required}
        />
      </div>
      {effectiveError && (
        <p className="flex items-center gap-1 text-sm text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {effectiveError}
        </p>
      )}
    </div>
  );
}
