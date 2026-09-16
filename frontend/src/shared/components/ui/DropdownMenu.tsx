import {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  useState,
  useEffect,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/utils/cn';

export interface DropdownMenuItem {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  trigger: ReactElement<{ onClick?: () => void; 'aria-haspopup'?: boolean; 'aria-expanded'?: boolean }>;
  items: DropdownMenuItem[];
  align?: 'start' | 'end';
}

/** Row-action menu. Full keyboard support; closes on Escape and outside click. */
export function DropdownMenu({ trigger, items, align = 'end' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number }>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      close();
    };
    const handleScrollOrResize = () => close();

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    window.addEventListener('scroll', handleScrollOrResize, true); // true for capture phase to catch internal scrolls
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  const enabledIndexes = items
    .map((item, index) => (item.disabled ? -1 : index))
    .filter((i) => i !== -1);

  function close() {
    setOpen(false);
  }

  function select(item: DropdownMenuItem) {
    if (item.disabled) return;
    item.onSelect();
    close();
  }

  function openMenu() {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (align === 'end') {
        setCoords({
          top: rect.bottom + window.scrollY,
          right: window.innerWidth - rect.right - window.scrollX,
        });
      } else {
        setCoords({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      }
      setOpen(true);
    }
  }

  function toggle() {
    if (open) close();
    else openMenu();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMenu();
        setActiveIndex(enabledIndexes[0] ?? 0);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const pos = enabledIndexes.indexOf(activeIndex);
      setActiveIndex(enabledIndexes[Math.min(pos + 1, enabledIndexes.length - 1)] ?? activeIndex);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const pos = enabledIndexes.indexOf(activeIndex);
      setActiveIndex(enabledIndexes[Math.max(pos - 1, 0)] ?? activeIndex);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const item = items[activeIndex];
      if (item) select(item);
    }
  }

  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger, {
        onClick: toggle,
        'aria-haspopup': true,
        'aria-expanded': open,
      })
    : trigger;

  return (
    <div className="relative inline-block" ref={containerRef} onKeyDown={handleKeyDown}>
      {triggerElement}
      {open && typeof document !== 'undefined' && createPortal(
        <ul
          id={menuId}
          ref={menuRef}
          role="menu"
          style={{ top: coords.top, left: coords.left, right: coords.right }}
          className="absolute z-50 mt-1 min-w-40 rounded-md border border-border bg-bg-card py-1 shadow-lg"
        >
          {items.map((item, index) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={(e) => {
                  e.stopPropagation();
                  select(item);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-(--transition-fast)',
                  item.disabled && 'cursor-not-allowed text-text-muted',
                  !item.disabled && item.danger && 'text-danger',
                  !item.disabled && !item.danger && 'text-text-primary',
                  !item.disabled && index === activeIndex && 'bg-bg-subtle',
                )}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}
