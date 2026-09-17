import { useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/utils/cn';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const GAP = 8;

const SIDE_TRANSFORM: Record<NonNullable<TooltipProps['side']>, string> = {
  top: '-translate-x-1/2 -translate-y-full',
  bottom: '-translate-x-1/2',
  left: '-translate-x-full -translate-y-1/2',
  right: '-translate-y-1/2',
};

/**
 * Wraps `children` in a focus/hover region rather than cloning props onto
 * it, so it works with any child (button, icon, disabled control) without
 * needing to know its prop types. React's onFocus/onBlur bubble like
 * focusin/focusout, so focusing the inner child still triggers this.
 *
 * The bubble itself renders through a portal into `document.body`, positioned
 * from the trigger's bounding rect. It must live outside any scrollable
 * ancestor (e.g. the collapsed sidebar rail) — an absolutely-positioned bubble
 * left inside one still counts toward that ancestor's scrollable overflow even
 * while invisible, which forces a spurious scrollbar.
 */
export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  function show() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      switch (side) {
        case 'top':
          setCoords({ top: rect.top - GAP, left: rect.left + rect.width / 2 });
          break;
        case 'bottom':
          setCoords({ top: rect.bottom + GAP, left: rect.left + rect.width / 2 });
          break;
        case 'left':
          setCoords({ top: rect.top + rect.height / 2, left: rect.left - GAP });
          break;
        case 'right':
          setCoords({ top: rect.top + rect.height / 2, left: rect.right + GAP });
          break;
      }
    }
    setVisible(true);
  }

  function hide() {
    setVisible(false);
  }

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span aria-describedby={tooltipId} className="inline-flex">
        {children}
      </span>
      {createPortal(
        <span
          role="tooltip"
          id={tooltipId}
          style={{ top: coords.top, left: coords.left }}
          className={cn(
            'pointer-events-none fixed z-30 whitespace-nowrap rounded-md bg-text-primary px-2 py-1 text-xs text-white shadow-md transition-opacity duration-(--transition-fast)',
            SIDE_TRANSFORM[side],
            visible ? 'opacity-100' : 'opacity-0',
          )}
        >
          {content}
        </span>,
        document.body,
      )}
    </span>
  );
}
