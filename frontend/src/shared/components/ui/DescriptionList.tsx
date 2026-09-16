import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface DescriptionItem {
  label: string;
  value: ReactNode;
}

export interface DescriptionListProps {
  items: DescriptionItem[];
  columns?: 1 | 2;
  className?: string;
}

export function DescriptionList({ items, columns = 2, className }: DescriptionListProps) {
  return (
    <dl
      className={cn(
        'grid grid-cols-1 gap-x-6 gap-y-4',
        columns === 2 && 'sm:grid-cols-2',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <dt className="text-sm text-text-muted">{item.label}</dt>
          <dd className="text-sm font-medium text-text-primary">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
