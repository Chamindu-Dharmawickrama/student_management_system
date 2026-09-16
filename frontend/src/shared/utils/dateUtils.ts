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

const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
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

/**
 * Formats an ISO date string as "Aug 28, 2026, 3:45 PM".
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-US', DATE_TIME_FORMAT);
}

/**
 * Formats a start/end ISO pair as "Aug 28 – Sep 12, 2026".
 * Falls back to a single formatted date, or an em dash, when one side is missing.
 */
export function formatDateRange(
  startStr: string | null | undefined,
  endStr: string | null | undefined,
): string {
  if (!startStr && !endStr) return '—';
  if (!startStr) return formatDate(endStr);
  if (!endStr) return formatDate(startStr);

  const start = new Date(startStr);
  const end = new Date(endStr);
  const sameYear = start.getFullYear() === end.getFullYear();

  const startLabel = start.toLocaleDateString(
    'en-US',
    sameYear ? { month: 'short', day: 'numeric' } : DATE_FORMAT,
  );
  const endLabel = end.toLocaleDateString('en-US', DATE_FORMAT);

  return `${startLabel} – ${endLabel}`;
}

/**
 * Converts a `<input type="date">` value ("YYYY-MM-DD") to an ISO datetime
 * string suitable for the backend's `z.coerce.date()`, anchored at local
 * midnight so the calendar day never shifts across timezones.
 */
export function toISODateString(inputValue: string): string {
  if (!inputValue) return '';
  const [year, month, day] = inputValue.split('-').map(Number);
  return new Date(year, month - 1, day).toISOString();
}

/**
 * Converts an API ISO datetime string to the "YYYY-MM-DD" shape
 * `<input type="date">` expects, using local calendar fields so the
 * displayed day matches what was originally picked.
 */
export function fromISODateString(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * True when the given ISO date string is strictly before now.
 */
export function isDatePast(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

/**
 * Whole number of days between two ISO date strings (end - start).
 * Negative when `endStr` is earlier than `startStr`.
 */
export function daysBetween(
  startStr: string | null | undefined,
  endStr: string | null | undefined,
): number {
  if (!startStr || !endStr) return 0;
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const start = new Date(startStr);
  const end = new Date(endStr);
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}
