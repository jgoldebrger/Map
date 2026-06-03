export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

const weekdaySet = new Set<string>(WEEKDAYS);

export function isWeekday(value: string): value is Weekday {
  return weekdaySet.has(value);
}

export function parseShipDays(value?: string | null): Weekday[] {
  if (!value?.trim()) return [];
  return value
    .split(/,\s*/)
    .map((part) => part.trim())
    .filter((part): part is Weekday => isWeekday(part));
}

export function parseCutoffDay(value?: string | null): Weekday | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  return isWeekday(trimmed) ? trimmed : undefined;
}

/** First weekday from stored ship day (handles legacy comma-separated values). */
export function parseShipDay(value?: string | null): Weekday | undefined {
  const days = parseShipDays(value);
  if (days.length > 0) return days[0];
  return parseCutoffDay(value);
}

/** Sort key for ship/cutoff columns: Mon=0 … Sun=6, empty/invalid last. */
export function weekdaySortIndex(value?: string | null): number {
  const days = parseShipDays(value);
  if (days.length > 0) {
    return Math.min(...days.map((day) => WEEKDAYS.indexOf(day)));
  }
  const single = parseCutoffDay(value);
  if (single) return WEEKDAYS.indexOf(single);
  return 999;
}
