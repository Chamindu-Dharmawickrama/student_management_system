import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, id, className, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;

    return (
      <div className="flex items-start gap-2">
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={cn(
              'peer h-5 w-5 shrink-0 appearance-none rounded-sm border border-border-strong bg-bg-card transition-colors duration-(--transition-fast) checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            {...props}
          />
          <Check
            className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100"
            aria-hidden="true"
          />
        </div>
        {(label || description) && (
          <label htmlFor={checkboxId} className="flex flex-col gap-0.5 text-sm">
            {label && <span className="font-medium text-text-primary">{label}</span>}
            {description && <span className="text-text-muted">{description}</span>}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';
