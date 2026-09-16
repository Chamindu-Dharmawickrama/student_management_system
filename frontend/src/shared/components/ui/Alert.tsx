import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  variant?: AlertVariant;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const VARIANT_CONFIG: Record<AlertVariant, { icon: typeof Info; classes: string; iconClasses: string }> = {
  info: {
    icon: Info,
    classes: 'bg-info-subtle border-info/30 text-info-strong',
    iconClasses: 'text-info',
  },
  success: {
    icon: CheckCircle2,
    classes: 'bg-success-subtle border-success/30 text-success-strong',
    iconClasses: 'text-success',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'bg-warning-subtle border-warning/30 text-warning-strong',
    iconClasses: 'text-warning',
  },
  danger: {
    icon: XCircle,
    classes: 'bg-danger-subtle border-danger/30 text-danger-strong',
    iconClasses: 'text-danger',
  },
};

export function Alert({ variant = 'info', title, children, action, onDismiss, className }: AlertProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border p-4', config.classes, className)}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconClasses)} aria-hidden="true" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        {children && <div className="text-sm">{children}</div>}
        {action && <div className="pt-1">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-sm p-0.5 hover:opacity-70 focus-visible:outline-none"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
