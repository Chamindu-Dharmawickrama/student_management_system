import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, id, className, ...props }, ref) => {
    const generatedId = useId();
    const switchId = id ?? generatedId;

    return (
      <div className="flex items-start gap-3">
        <div className="relative inline-flex h-6 w-11 shrink-0 items-center">
          <input
            ref={ref}
            id={switchId}
            type="checkbox"
            role="switch"
            className={cn(
              'peer h-6 w-11 shrink-0 appearance-none rounded-full bg-border-strong transition-colors duration-(--transition-fast) checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            {...props}
          />
          <span
            className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-(--transition-fast) peer-checked:translate-x-5"
            aria-hidden="true"
          />
        </div>
        {(label || description) && (
          <label htmlFor={switchId} className="flex flex-col gap-0.5 text-sm">
            {label && <span className="font-medium text-text-primary">{label}</span>}
            {description && <span className="text-text-muted">{description}</span>}
          </label>
        )}
      </div>
    );
  },
);
Switch.displayName = 'Switch';
