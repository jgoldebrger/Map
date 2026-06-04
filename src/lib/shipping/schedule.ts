import { addDays, format, isAfter, startOfDay } from "date-fns";
import { parseCutoffDay, parseShipDays, WEEKDAYS, type Weekday } from "@/lib/weekdays";
import type { LookupResult } from "@/lib/services/lookup";

export type ScheduleAnswer = {
  county?: string;
  state?: string;
  city?: string;
  zip?: string;
  territory: string;
  shippingMethod: string;
  shipDays: string[];
  cutoffDay: string | null;
  nextShipDates: string[];
  asOf: string;
  unassigned: boolean;
  zipOverride?: boolean;
  countyTerritory?: string | null;
  assumptions: string[];
};

const SCHEDULE_ASSUMPTIONS = ["cutoff end-of-day"] as const;

function weekdayIndex(day: Weekday): number {
  return WEEKDAYS.indexOf(day);
}

/** Monday-based start of the calendar week containing `date`. */
function startOfWeekMonday(date: Date): Date {
  const d = startOfDay(date);
  const jsDay = d.getDay();
  const daysSinceMonday = jsDay === 0 ? 6 : jsDay - 1;
  return addDays(d, -daysSinceMonday);
}

function jsDayToWeekdayIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * If cutoff has passed this week (after cutoff weekday), earliest ship search starts next Monday.
 * On the cutoff weekday itself, end-of-day still counts as before cutoff.
 */
export function getEffectiveStartDate(fromDate: Date, cutoffDay?: Weekday | null): Date {
  const today = startOfDay(fromDate);
  if (!cutoffDay) return today;

  const weekStart = startOfWeekMonday(today);
  const cutoffDate = addDays(weekStart, weekdayIndex(cutoffDay));

  if (isAfter(today, cutoffDate)) {
    return addDays(weekStart, 7);
  }
  return today;
}

/** Next N calendar dates that fall on any configured ship weekday. */
export function nextShipDates(
  shipDays: Weekday[],
  fromDate: Date,
  count: number,
  cutoffDay?: Weekday | null,
): Date[] {
  if (shipDays.length === 0 || count <= 0) return [];

  const shipIndices = new Set(shipDays.map((d) => weekdayIndex(d)));
  const start = getEffectiveStartDate(fromDate, cutoffDay);
  const results: Date[] = [];
  let cursor = start;

  for (let i = 0; i < 366 && results.length < count; i++) {
    if (shipIndices.has(jsDayToWeekdayIndex(cursor.getDay()))) {
      results.push(new Date(cursor));
    }
    cursor = addDays(cursor, 1);
  }

  return results;
}

export function formatScheduleAnswer(
  lookup: LookupResult,
  asOfDate: Date = new Date(),
  nextDateCount = 4,
): ScheduleAnswer {
  const shipDays = parseShipDays(lookup.shipDay);
  const cutoffDay = parseCutoffDay(lookup.cutoffDay) ?? null;
  const dates = nextShipDates(shipDays, asOfDate, nextDateCount, cutoffDay);

  return {
    county: lookup.county,
    state: lookup.state,
    city: lookup.city,
    zip: lookup.zip,
    territory: lookup.territory,
    shippingMethod: lookup.shippingMethod,
    shipDays: shipDays.length > 0 ? [...shipDays] : [],
    cutoffDay: lookup.cutoffDay,
    nextShipDates: dates.map((d) => format(d, "yyyy-MM-dd")),
    asOf: format(startOfDay(asOfDate), "yyyy-MM-dd"),
    unassigned: lookup.unassigned ?? false,
    zipOverride: lookup.zipOverride,
    countyTerritory: lookup.countyTerritory,
    assumptions: [...SCHEDULE_ASSUMPTIONS],
  };
}

export function parseAsOfDate(value?: string | null): Date {
  if (!value?.trim()) return new Date();
  const parsed = new Date(`${value.trim()}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
