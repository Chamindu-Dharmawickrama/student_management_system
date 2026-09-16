import { AlertOctagon } from 'lucide-react';
import { getErrorMessage } from '@/types/api.types';
import { Button } from './Button';
import { cn } from '@/shared/utils/cn';

export interface ErrorStateProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, message, onRetry, className }: ErrorStateProps) {
  const displayMessage = message || getErrorMessage(error) || 'An unexpected error occurred while loading this content.';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-danger/30 bg-danger-subtle px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-danger">
        <AlertOctagon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-danger-strong">{displayMessage}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
