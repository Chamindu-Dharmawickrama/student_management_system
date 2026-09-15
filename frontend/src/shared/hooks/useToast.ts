import { useMemo } from 'react';
import toast from 'react-hot-toast';

/**
 * Typed wrapper around react-hot-toast.
 * Provides consistent toast styling across the application.
 * PERF-2: useMemo stabilizes the returned object so consumers don't re-render
 * unnecessarily when the parent re-renders.
 */
export function useToast() {
  return useMemo(
    () => ({
      success: (message: string) => toast.success(message),
      error: (message: string) => toast.error(message),
      loading: (message: string) => toast.loading(message),
      dismiss: (id?: string) => toast.dismiss(id),
      promise: <T>(
        promise: Promise<T>,
        messages: { loading: string; success: string; error: string },
      ) => toast.promise(promise, messages),
    }),
    [],
  );
}

