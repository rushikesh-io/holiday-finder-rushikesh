/**
 * Date helpers. Holidays are calendar dates ("2026-12-25"), not moments in time,
 * so everything here works with local dates and whole days to avoid time-zone bugs.
 */

const DAY_MS = 86_400_000;

/** Parse "YYYY-MM-DD" as a local date (new Date("2026-01-01") would be UTC). */
export function parseISODate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);
}

export function isSameDay(a, b) {
  return daysBetween(a, b) === 0;
}

const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const weekdayName = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });

export const formatLongDate = (date) => longDate.format(date); // "Thursday 1 January 2026"
export const formatShortDate = (date) => shortDate.format(date); // "1 Jan 2026"
export const formatWeekday = (date) => weekdayName.format(date); // "Thursday"

export const MONTH_NAMES = Array.from({ length: 12 }, (_, m) =>
  new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(new Date(2026, m, 1))
);

/** Weekday letters for a Monday-first calendar. */
export const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** "today", "tomorrow", "in 5 days", "yesterday", "3 days ago" */
export function describeDistance(days) {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

/**
 * The days of one month laid out in Monday-first weeks, padded with `null`
 * so every row has 7 cells. Used to draw the mini calendars.
 * @returns {(number|null)[][]}
 */
export function monthGrid(year, month) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
