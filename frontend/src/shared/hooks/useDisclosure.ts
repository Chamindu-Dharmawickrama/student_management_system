import { useState, useCallback } from 'react';

export interface DisclosureState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Manages a boolean open/closed state with stable callback references.
 * Use for modals, dropdowns, drawers, accordions, etc.
 */
export function useDisclosure(initialState = false): DisclosureState {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
