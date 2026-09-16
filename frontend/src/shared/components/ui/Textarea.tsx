import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, hint, error, required, id, maxLength, value, className, containerClassName, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text-primary">
            {label}
            {required && (
              <span className="ml-0.5 text-danger" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          maxLength={maxLength}
          value={value}
          aria-invalid={!!error || undefined}
          aria-describedby={cn(hintId, errorId) || undefined}
          className={cn(
            'min-h-24 w-full resize-y rounded-md border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-(--transition-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-bg-subtle disabled:text-text-muted',
            error ? 'border-danger' : 'border-border-strong',
            className,
          )}
          {...props}
        />
        <div className="flex items-start justify-between gap-2">
          {error ? (
            <p id={errorId} className="flex items-center gap-1 text-sm text-danger">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : hint ? (
            <p id={hintId} className="text-sm text-text-muted">
              {hint}
            </p>
          ) : (
            <span />
          )}
          {maxLength && (
            <span className="shrink-0 text-xs tabular-nums text-text-muted" aria-live="polite">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
