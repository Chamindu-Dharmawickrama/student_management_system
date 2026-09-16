/**
 * Joins a first/last name pair, collapsing extra whitespace.
 */
export function formatName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

/**
 * Renders a mark value for display: "—" when null, "Absent" when the
 * student was marked absent, otherwise "obtained/max".
 */
export function formatMark(
  value: number | null | undefined,
  max: number,
  isAbsent?: boolean,
): string {
  if (isAbsent) return 'Absent';
  if (value === null || value === undefined) return '—';
  return `${value}/${max}`;
}

/**
 * Formats a 0–100 fraction as a rounded percentage string, e.g. "82%".
 */
export function formatPercentage(
  value: number | null | undefined,
  max: number,
): string {
  if (value === null || value === undefined || max <= 0) return '—';
  return `${Math.round((value / max) * 100)}%`;
}

/**
 * Up to two-letter initials from a first/last name pair, for Avatar fallbacks.
 */
export function initials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const first = firstName?.trim()?.[0] ?? '';
  const last = lastName?.trim()?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}
