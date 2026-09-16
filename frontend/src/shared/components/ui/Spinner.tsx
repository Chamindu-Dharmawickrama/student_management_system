import { cn } from '@/shared/utils/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  fullPage?: boolean;
  message?: string;
  className?: string;
}

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

export function Spinner({ size = 'md', fullPage = false, message, className }: SpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-border-strong border-t-primary',
        SIZE_CLASSES[size],
        className,
      )}
      aria-hidden="true"
    />
  );

  if (fullPage) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-3 py-16"
      >
        {spinner}
        {message && <p className="text-sm text-text-muted">{message}</p>}
        <span className="sr-only">{message ?? 'Loading'}</span>
      </div>
    );
  }

  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
      {spinner}
      {message && <span className="text-sm text-text-muted">{message}</span>}
      {!message && <span className="sr-only">Loading</span>}
    </span>
  );
}
