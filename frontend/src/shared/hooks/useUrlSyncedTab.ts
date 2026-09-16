import { useSearchParams } from 'react-router-dom';

/**
 * URL-synced active tab — reads/writes to a search param (default `tab`) so
 * the browser back button and shareable links work with `Tabs`.
 */
export function useUrlSyncedTab(
  defaultValue: string,
  paramName = 'tab',
): [string, (value: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(paramName) ?? defaultValue;

  const setValue = (next: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next === defaultValue) params.delete(paramName);
      else params.set(paramName, next);
      return params;
    });
  };

  return [value, setValue];
}
