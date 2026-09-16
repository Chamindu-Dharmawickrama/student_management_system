type ClassValue =
  | string
  | number
  | bigint
  | null
  | undefined
  | false
  | Record<string, boolean | null | undefined>;

/**
 * Minimal className combiner. No dependency on clsx/tailwind-merge —
 * accepts strings, falsy values (skipped), and { className: condition } maps.
 */
export function cn(...values: ClassValue[]): string {
  const classes: string[] = [];

  for (const value of values) {
    if (!value) continue;

    if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
      classes.push(String(value));
      continue;
    }

    for (const key in value) {
      if (value[key]) classes.push(key);
    }
  }

  return classes.join(" ");
}
