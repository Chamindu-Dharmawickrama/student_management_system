import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  prefix?: string;
  suffix?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      prefix,
      suffix,
      required,
      id,
      className,
      containerClassName,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
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
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 flex text-text-muted">
              {leftIcon}
            </span>
          )}
          {prefix && (
            <span className="absolute left-3 text-sm text-text-muted">{prefix}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={!!error || undefined}
            aria-describedby={cn(hintId, errorId) || undefined}
            className={cn(
              'h-10 w-full rounded-md border bg-bg-card px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-(--transition-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-bg-subtle disabled:text-text-muted',
              error ? 'border-danger' : 'border-border-strong',
              leftIcon && 'pl-9',
              prefix && 'pl-8',
              rightIcon && 'pr-9',
              suffix && 'pr-8',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 flex text-text-muted">{rightIcon}</span>
          )}
          {suffix && (
            <span className="absolute right-3 text-sm text-text-muted">{suffix}</span>
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
  },
);
Input.displayName = 'Input';
