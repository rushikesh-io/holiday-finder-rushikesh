/**
 * Holiday business logic. Pure functions only (no DOM, no network), so they are
 * easy to reason about and covered by the tests in /tests.
 */

import { parseISODate, daysBetween, formatWeekday } from '../utils/dates.js';
import { toCsv } from '../utils/csv.js';

/**
 * @typedef {object} Holiday
 * @property {string} id            unique and safe to use as an HTML id
 * @property {string} isoDate       "2026-12-25"
 * @property {Date}   date
 * @property {number} month         0–11
 * @property {string} weekday       "Friday"
 * @property {string} name
 * @property {string} localName
 * @property {string} countryCode
 * @property {string[]} types       e.g. ["Public", "Bank"]
 * @property {boolean} nationwide
 * @property {string[]} regions     region codes when not nationwide
 */

/** Turn one raw API record into a Holiday with safe defaults. */
export function toHoliday(raw, index = 0) {
  const date = parseISODate(raw.date);
  return {
    id: `holiday-${raw.date}-${index}`,
    isoDate: raw.date,
    date,
    month: date.getMonth(),
    weekday: formatWeekday(date),
    name: raw.name || 'Unnamed holiday',
    localName: raw.localName || '',
    countryCode: raw.countryCode,
    types: raw.types?.length ? raw.types : ['Public'],
    nationwide: raw.global !== false,
    regions: raw.counties ?? [],
  };
}

export function toHolidays(rawList) {
  return rawList.map(toHoliday).sort((a, b) => a.date - b.date);
}

/**
 * Add timing info relative to `today`:
 * daysAway, isPast, isToday, isNext (first holiday from today on),
 * isLongWeekend (Friday or Monday), isWeekend (Saturday or Sunday).
 */
export function annotate(holidays, today = new Date()) {
  let nextFound = false;
  return holidays.map((holiday) => {
    const daysAway = daysBetween(today, holiday.date);
    const day = holiday.date.getDay();
    const isNext = !nextFound && daysAway >= 0;
    if (isNext) nextFound = true;
    return {
      ...holiday,
      daysAway,
      isPast: daysAway < 0,
      isToday: daysAway === 0,
      isNext,
      isLongWeekend: day === 1 || day === 5,
      isWeekend: day === 0 || day === 6,
    };
  });
}

/**
 * @param {{ month: 'all'|number, types: Set<string> }} filters  empty `types` = all types
 */
export function filterHolidays(holidays, { month = 'all', types = new Set() } = {}) {
  return holidays.filter(
    (h) => (month === 'all' || h.month === month) && (types.size === 0 || h.types.some((t) => types.has(t)))
  );
}

/** Group holidays by month, keeping month order. @returns {{ month: number, holidays: object[] }[]} */
export function groupByMonth(holidays) {
  const groups = new Map();
  for (const holiday of holidays) {
    if (!groups.has(holiday.month)) groups.set(holiday.month, []);
    groups.get(holiday.month).push(holiday);
  }
  return [...groups].map(([month, items]) => ({ month, holidays: items }));
}

/** How many holidays have each type, most common first. @returns {[string, number][]} */
export function countTypes(holidays) {
  const counts = new Map();
  holidays.forEach((h) => h.types.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  return [...counts].sort((a, b) => b[1] - a[1]);
}

export function countByMonth(holidays) {
  const counts = Array(12).fill(0);
  holidays.forEach((h) => counts[h.month]++);
  return counts;
}

export function holidaysToCsv(holidays) {
  return toCsv(
    ['Date', 'Day of week', 'Holiday name', 'Local name', 'Country code', 'Holiday type', 'Scope'],
    holidays.map((h) => [
      h.isoDate,
      h.weekday,
      h.name,
      h.localName,
      h.countryCode,
      h.types.join(' / '),
      h.nationwide ? 'Nationwide' : `Regional (${h.regions.join(' ')})`,
    ])
  );
}
