import { useEffect, useState } from 'react';

/**
 * Returns a value that only updates after `delayMs` has passed without
 * `value` changing again. Used by SearchInput for debounced `q` filters.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
