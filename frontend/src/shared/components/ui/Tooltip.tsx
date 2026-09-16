import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const SIDE_CLASSES: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
};

/**
 * Wraps `children` in a focus/hover region rather than cloning props onto
 * it, so it works with any child (button, icon, disabled control) without
 * needing to know its prop types. React's onFocus/onBlur bubble like
 * focusin/focusout, so focusing the inner child still triggers this.
 */
export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={tooltipId} className="inline-flex">
        {children}
      </span>
      <span
        role="tooltip"
        id={tooltipId}
        className={cn(
          'pointer-events-none absolute z-30 whitespace-nowrap rounded-md bg-text-primary px-2 py-1 text-xs text-white shadow-md transition-opacity duration-(--transition-fast)',
          SIDE_CLASSES[side],
          visible ? 'opacity-100' : 'opacity-0',
        )}
      >
        {content}
      </span>
    </span>
  );
}
