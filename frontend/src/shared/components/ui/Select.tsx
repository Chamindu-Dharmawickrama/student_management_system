import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      hint,
      error,
      options,
      placeholder,
      required,
      id,
      className,
      containerClassName,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-text-primary">
            {label}
            {required && (
              <span className="ml-0.5 text-danger" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            required={required}
            aria-invalid={!!error || undefined}
            aria-describedby={cn(hintId, errorId) || undefined}
            className={cn(
              'h-10 w-full appearance-none rounded-md border bg-bg-card px-3 pr-9 text-sm text-text-primary transition-colors duration-(--transition-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-bg-subtle disabled:text-text-muted',
              error ? 'border-danger' : 'border-border-strong',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 text-text-muted"
            aria-hidden="true"
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
Select.displayName = 'Select';
