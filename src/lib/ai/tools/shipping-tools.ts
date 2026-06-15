import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { findCountiesByName } from "@/lib/services/county-search";
import {
  lookupByCounty,
  lookupByState,
  lookupByTerritory,
  lookupByZip,
} from "@/lib/services/lookup";
import { resolveUspsStateCode, USPS_STATE_NAMES } from "@/lib/us-states";
import {
  formatScheduleAnswer,
  parseAsOfDate,
  type ScheduleAnswer,
} from "@/lib/shipping/schedule";

function countyQuery(name: string, state?: string): string {
  return state ? `${name}, ${state}` : name;
}

export function createShippingTools(collectSource: (source: ScheduleAnswer) => void) {
  const searchCounties = new DynamicStructuredTool({
    name: "search_counties",
    description:
      "Search counties by name. Use when the user mentions a county without a state, or when names may be ambiguous (e.g. Washington). Returns up to 5 matches with FIPS, state, and territory.",
    schema: z.object({
      name: z.string().min(1).describe("County name, with or without the word County"),
      state: z
        .string()
        .length(2)
        .optional()
        .describe("Optional USPS state code to narrow results, e.g. IL"),
    }),
    func: async ({ name, state }) => {
      const matches = await findCountiesByName(name, state);
      return JSON.stringify({
        matches,
        count: matches.length,
        hint:
          matches.length === 0
            ? "No counties found. Ask the user to clarify the county and state."
            : matches.length > 1
              ? "Multiple counties matched. Ask the user which state they mean before giving ship dates."
              : "Single match — use get_county_ship_schedule with countyName and state.",
      });
    },
  });

  const getCountySchedule = new DynamicStructuredTool({
    name: "get_county_ship_schedule",
    description:
      "Get shipping schedule and next ship dates for a county. Always call this (or search_counties first) before stating county ship dates.",
    schema: z.object({
      countyName: z.string().min(1),
      state: z.string().length(2).optional(),
      asOfDate: z
        .string()
        .optional()
        .describe("ISO date yyyy-MM-dd; defaults to today"),
    }),
    func: async ({ countyName, state, asOfDate }) => {
      const lookup = await lookupByCounty(countyQuery(countyName, state));
      if (!lookup) {
        return JSON.stringify({
          error: "County not found",
          hint: "Use search_counties to find the correct county and state.",
        });
      }
      const answer = formatScheduleAnswer(lookup, parseAsOfDate(asOfDate));
      collectSource(answer);
      return JSON.stringify(answer);
    },
  });

  const getZipSchedule = new DynamicStructuredTool({
    name: "get_zip_ship_schedule",
    description:
      "Get shipping schedule for a ZIP code. Use when the user provides a ZIP — captures ZIP-level territory overrides.",
    schema: z.object({
      zip: z.string().min(5).max(10),
      asOfDate: z.string().optional(),
    }),
    func: async ({ zip, asOfDate }) => {
      const lookup = await lookupByZip(zip);
      if (!lookup) {
        return JSON.stringify({ error: "ZIP code not found in database" });
      }
      const answer = formatScheduleAnswer(lookup, parseAsOfDate(asOfDate));
      collectSource(answer);
      return JSON.stringify(answer);
    },
  });

  const getTerritorySchedule = new DynamicStructuredTool({
    name: "get_territory_schedule",
    description: "Get ship days and cutoff for a territory by name.",
    schema: z.object({
      territoryName: z.string().min(1),
      asOfDate: z.string().optional(),
    }),
    func: async ({ territoryName, asOfDate }) => {
      const lookup = await lookupByTerritory(territoryName);
      if (!lookup) {
        return JSON.stringify({ error: "Territory not found" });
      }
      const answer = formatScheduleAnswer(lookup, parseAsOfDate(asOfDate));
      collectSource(answer);
      return JSON.stringify(answer);
    },
  });

  const getStateSchedule = new DynamicStructuredTool({
    name: "get_state_ship_schedule",
    description:
      "Get shipping schedules for all territories assigned in a US state. Use when the user asks about a state (e.g. Florida, FL, New Jersey) without a specific county or ZIP.",
    schema: z.object({
      state: z
        .string()
        .min(2)
        .describe("US state full name or 2-letter USPS code, e.g. Florida or FL"),
      asOfDate: z.string().optional(),
    }),
    func: async ({ state, asOfDate }) => {
      const code = resolveUspsStateCode(state);
      if (!code) {
        return JSON.stringify({
          error: "State not recognized",
          hint: "Use a US state name (Florida) or USPS code (FL).",
        });
      }

      const lookups = await lookupByState(code);
      if (lookups.length === 0) {
        return JSON.stringify({ error: "No counties found for that state in the database" });
      }

      const asOf = parseAsOfDate(asOfDate);
      const territories = lookups.map((lookup) => {
        const schedule = formatScheduleAnswer(lookup, asOf);
        collectSource(schedule);
        return schedule;
      });

      return JSON.stringify({
        state: code,
        stateName: USPS_STATE_NAMES[code] ?? code,
        territoryCount: territories.length,
        territories,
        hint:
          territories.length > 1
            ? "List each territory with ship days and next ship dates. Counties in this state map to one of these territories."
            : territories[0]?.unassigned
              ? "This state has no territory assignments yet."
              : "Summarize the territory schedule for this state.",
      });
    },
  });

  return [searchCounties, getCountySchedule, getZipSchedule, getTerritorySchedule, getStateSchedule];
}
