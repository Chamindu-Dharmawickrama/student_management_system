import { useEffect, type RefObject } from 'react';

/**
 * Calls `handler` on any pointer event outside `ref`'s element.
 * Used by Dropdown/DropdownMenu/Combobox to close on outside click.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    function handlePointerDown(event: PointerEvent) {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handler();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [ref, handler, enabled]);
}
