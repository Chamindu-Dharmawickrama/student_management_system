import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  /** ISO "YYYY-MM-DD" value, matching what `<input type="date">` reads/writes. */
  value?: string;
  min?: string;
  max?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, hint, error, required, id, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
            {required && (
              <span className="ml-0.5 text-danger" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative flex items-center">
          <Calendar
            className="pointer-events-none absolute left-3 h-4 w-4 text-text-muted"
            aria-hidden="true"
          />
          <input
            ref={ref}
            id={inputId}
            type="date"
            required={required}
            aria-invalid={!!error || undefined}
            aria-describedby={cn(hintId, errorId) || undefined}
            className={cn(
              'h-10 w-full rounded-md border bg-bg-card pl-9 pr-3 text-sm text-text-primary transition-colors duration-(--transition-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-bg-subtle disabled:text-text-muted',
              error ? 'border-danger' : 'border-border-strong',
              className,
            )}
            {...props}
          />
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
  },
);
DatePicker.displayName = 'DatePicker';
