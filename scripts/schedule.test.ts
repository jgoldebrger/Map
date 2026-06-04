import { format, startOfDay } from "date-fns";
import {
  getEffectiveStartDate,
  nextShipDates,
} from "../src/lib/shipping/schedule";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function d(iso: string): Date {
  return startOfDay(new Date(`${iso}T12:00:00`));
}

// Wednesday 2026-06-03, ship Mon/Wed, no cutoff → next dates include today+ and Mon/Wed
{
  const from = d("2026-06-03");
  const dates = nextShipDates(["Monday", "Wednesday"], from, 3);
  assert(dates.length === 3, "expected 3 ship dates");
  assert(format(dates[0], "yyyy-MM-dd") === "2026-06-03", "first ship date should be Wed 6/3");
  assert(format(dates[1], "yyyy-MM-dd") === "2026-06-08", "second ship date should be Mon 6/8");
  assert(format(dates[2], "yyyy-MM-dd") === "2026-06-10", "third ship date should be Wed 6/10");
}

// Friday cutoff: Saturday after cutoff → start next week (Monday)
{
  const from = d("2026-06-06"); // Saturday
  const start = getEffectiveStartDate(from, "Friday");
  assert(format(start, "yyyy-MM-dd") === "2026-06-08", "after Friday cutoff, start next Monday");
  const dates = nextShipDates(["Monday", "Wednesday"], from, 2, "Friday");
  assert(format(dates[0], "yyyy-MM-dd") === "2026-06-08", "first ship after cutoff is Monday");
  assert(format(dates[1], "yyyy-MM-dd") === "2026-06-10", "second ship after cutoff is Wednesday");
}

// On cutoff day (Friday) still counts as before cutoff
{
  const from = d("2026-06-05"); // Friday
  const start = getEffectiveStartDate(from, "Friday");
  assert(format(start, "yyyy-MM-dd") === "2026-06-05", "on cutoff day, start today");
}

// Thursday before Friday cutoff uses today
{
  const from = d("2026-06-04"); // Thursday
  const dates = nextShipDates(["Monday", "Wednesday"], from, 1, "Friday");
  assert(dates.length === 1, "expected one date");
  assert(format(dates[0], "yyyy-MM-dd") === "2026-06-08", "Thu before cutoff → next Mon");
}

// Empty ship days
{
  const dates = nextShipDates([], d("2026-06-03"), 3);
  assert(dates.length === 0, "no ship days → no dates");
}

console.log("schedule tests passed");
