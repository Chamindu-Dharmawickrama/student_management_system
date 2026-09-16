import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';

export type DrawerSize = 'sm' | 'md' | 'lg';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: DrawerSize;
  side?: 'left' | 'right';
}

const SIZE_CLASSES: Record<DrawerSize, string> = {
  sm: 'max-w-xs',
  md: 'max-w-sm',
  lg: 'max-w-md',
};

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  side = 'right',
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useFocusTrap(panelRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-slate-900/50" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex h-full w-full flex-col bg-bg-card shadow-xl',
          SIZE_CLASSES[size],
          side === 'right' ? 'ml-auto' : 'mr-auto',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-text-primary">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="shrink-0 rounded-sm p-1 text-text-muted hover:text-text-primary focus-visible:outline-none"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-border p-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
