import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-bg-subtle text-text-secondary',
  success: 'bg-success-subtle text-success-strong',
  warning: 'bg-warning-subtle text-warning-strong',
  danger: 'bg-danger-subtle text-danger-strong',
  info: 'bg-info-subtle text-info-strong',
  primary: 'bg-primary-subtle text-primary-700',
};

const DOT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-text-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  primary: 'bg-primary',
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'h-5 px-2 text-xs gap-1',
  md: 'h-6 px-2.5 text-sm gap-1.5',
};

export function Badge({ variant = 'neutral', size = 'md', dot, icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_CLASSES[variant])}
          aria-hidden="true"
        />
      )}
      {icon}
      {children}
    </span>
  );
}
