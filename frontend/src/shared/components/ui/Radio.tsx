import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, id, className, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id ?? generatedId;

    return (
      <div className="flex items-start gap-2">
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={radioId}
            type="radio"
            className={cn(
              'peer h-5 w-5 shrink-0 appearance-none rounded-full border border-border-strong bg-bg-card transition-colors duration-(--transition-fast) checked:border-[5px] checked:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            {...props}
          />
        </div>
        {(label || description) && (
          <label htmlFor={radioId} className="flex flex-col gap-0.5 text-sm">
            {label && <span className="font-medium text-text-primary">{label}</span>}
            {description && <span className="text-text-muted">{description}</span>}
          </label>
        )}
      </div>
    );
  },
);
Radio.displayName = 'Radio';
