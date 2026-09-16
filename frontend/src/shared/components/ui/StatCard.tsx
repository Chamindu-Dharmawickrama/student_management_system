import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  href?: string;
  className?: string;
}

export function StatCard({ label, value, icon, trend, href, className }: StatCardProps) {
  const content = (
    <Card className={cn('p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">{value}</p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div
          className={cn(
            'mt-2 inline-flex items-center gap-1 text-xs font-medium',
            trend.value >= 0 ? 'text-success' : 'text-danger',
          )}
        >
          {trend.value >= 0 ? (
            <ArrowUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ArrowDown className="h-3 w-3" aria-hidden="true" />
          )}
          {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </Card>
  );

  if (href) {
    return (
      <Link to={href} className="block rounded-lg focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
