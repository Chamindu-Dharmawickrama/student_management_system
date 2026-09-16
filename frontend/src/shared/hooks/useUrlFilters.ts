import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

type FilterValues = Record<string, string>;

/**
 * Reads/writes a typed filter object to the URL's search params, so list
 * views are shareable and the back button works. `defaults` supplies the
 * fallback value for any param that isn't present; a value equal to its
 * default is omitted from the URL to keep it clean.
 *
 * Setting any key other than `page` resets `page` back to "1", matching the
 * expected behaviour of every paginated list screen in this app.
 */
export function useUrlFilters<T extends FilterValues>(
  defaults: T,
): [T, (patch: Partial<T>) => void, () => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = searchParams.get(String(key));
      if (value !== null) result[key] = value as T[keyof T];
    }
    return result;
  }, [searchParams, defaults]);

  const setFilters = useCallback(
    (patch: Partial<T>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const key of Object.keys(patch) as (keyof T)[]) {
          const value = patch[key];
          const isDefault = value === undefined || value === defaults[key];
          if (isDefault) {
            next.delete(String(key));
          } else {
            next.set(String(key), String(value));
          }
        }
        const changedNonPage = Object.keys(patch).some((key) => key !== 'page');
        if (changedNonPage && 'page' in defaults) {
          next.delete('page');
        }
        return next;
      });
    },
    [setSearchParams, defaults],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return [filters, setFilters, clearFilters];
}
