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

export function formatShipDays(days: readonly string[]): string | undefined {
  const ordered = WEEKDAYS.filter((day) => days.includes(day));
  if (ordered.length === 0) return undefined;
  return ordered.join(", ");
}

export function parseCutoffDay(value?: string | null): Weekday | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  return isWeekday(trimmed) ? trimmed : undefined;
}
