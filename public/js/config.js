/**
 * App-wide constants. Change behaviour here instead of hunting through the code.
 */

export const API_BASE_URL = 'https://date.nager.at/api/v3';

/** The Nager.Date API only accepts years in this range. */
export const YEAR_MIN = 1975;
export const YEAR_MAX = 2075;

export const DEFAULT_COUNTRY = 'US';
export const MAX_HISTORY_ITEMS = 8;

export const STORAGE_KEYS = {
  history: 'holiday-finder-rushikesh:history',
  theme: 'holiday-finder-rushikesh:theme', // also read by the inline script in index.html
  view: 'holiday-finder-rushikesh:view',
};

/**
 * Holiday types returned by the API, with a plain-language explanation for each.
 * Order here is the order the filter buttons appear in.
 */
export const HOLIDAY_TYPES = {
  Public: 'Public holiday: a day off for most people',
  Bank: 'Bank holiday: banks and many offices close',
  School: 'School holiday: schools close',
  Authorities: 'Government offices close',
  Optional: 'Optional: people may choose to take the day off',
  Observance: 'Observance: marked, but usually not a day off',
};
