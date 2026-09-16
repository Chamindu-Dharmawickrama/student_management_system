import { cn } from '@/shared/utils/cn';

export interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function ProgressBar({ value, max, label, showValue = true, className }: ProgressBarProps) {
  const clamped = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-text-secondary">{label}</span>}
          {showValue && (
            <span className="tabular-nums font-medium text-text-primary">
              {value} of {max}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-bg-subtle"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-(--transition-base)"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
