import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ConfirmDialog, type ConfirmDialogProps } from '@/shared/components/ui/ConfirmDialog';

export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  'isOpen' | 'onClose' | 'onConfirm' | 'isLoading'
>;

export interface UseConfirmResult {
  /** Opens the confirm dialog and resolves to `true`/`false` on confirm/cancel. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Render this once, anywhere in the tree — it renders nothing until `confirm()` is called. */
  dialog: ReactNode;
}

/**
 * Imperative confirm-dialog helper. Renders a `ConfirmDialog` on demand
 * instead of requiring every call site to manage its own open/close state.
 */
export function useConfirm(): UseConfirmResult {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(nextOptions);
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const dialog = options ? (
    <ConfirmDialog
      isOpen
      onClose={() => settle(false)}
      onConfirm={() => settle(true)}
      {...options}
    />
  ) : null;

  return { confirm, dialog };
}
