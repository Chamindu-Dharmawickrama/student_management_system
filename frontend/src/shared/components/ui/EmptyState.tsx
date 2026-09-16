import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-subtle text-text-muted">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden="true" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {description && <p className="text-sm text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
