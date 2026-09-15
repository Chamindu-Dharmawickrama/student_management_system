const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

const DATE_FORMAT_LONG: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/**
 * Formats an ISO date string as "Aug 28, 2026".
 * Returns an empty string for falsy input.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', DATE_FORMAT);
}

/**
 * Formats an ISO date string as "August 28, 2026".
 */
export function formatDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString('en-US', DATE_FORMAT_LONG);
}

/**
 * Returns a relative time string ("2 minutes ago", "3 days ago")
 * using the Intl.RelativeTimeFormat API.
 */
export function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'seconds');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minutes');
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hours');
  return rtf.format(diffDay, 'days');
}
