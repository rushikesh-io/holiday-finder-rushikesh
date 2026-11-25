/**
 * api.js — everything that talks to the Nager.Date public holiday API.
 * Docs: https://date.nager.at/Api
 */

import { parseLocalDate } from './utils.js';

const API_BASE = 'https://date.nager.at/api/v3';

/** Years the API accepts. */
export const MIN_YEAR = 1975;
export const MAX_YEAR = 2075;

/** An error with a message that is safe and friendly to show to the user. */
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Shared request helper.
 * - Network failures and HTTP errors become friendly ApiErrors.
 * - "204 No Content" (the API's answer when it has no data) becomes `null`.
 */
async function request(path, { signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Network error — please check your internet connection and try again.');
  }

  if (response.status === 204) return null;

  if (!response.ok) {
    if (response.status === 404) throw new ApiError('This country is not supported by the holiday service.', 404);
    if (response.status === 400) throw new ApiError(`Please choose a year between ${MIN_YEAR} and ${MAX_YEAR}.`, 400);
    if (response.status === 429) throw new ApiError('Too many requests — please wait a moment and try again.', 429);
    throw new ApiError(`The holiday service returned an error (${response.status}). Please try again.`, response.status);
  }

  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError('The holiday service sent an unexpected response. Please try again.', response.status);
  }
}

/**
 * List of supported countries, sorted by name.
 * Written with .then()/.catch() so failures are reported with a clear message.
 * @returns {Promise<{countryCode: string, name: string}[]>}
 */
export function getCountries(signal) {
  return request('/AvailableCountries', { signal })
    .then((list) => (list || []).slice().sort((a, b) => a.name.localeCompare(b.name)))
    .catch((error) => {
      if (error.name === 'AbortError' || error instanceof ApiError) throw error;
      throw new ApiError('Could not load the list of countries.');
    });
}

/** Convert a raw API holiday into the shape the UI uses (with safe fallbacks). */
export function normalizeHoliday(raw) {
  const date = parseLocalDate(raw.date);
  return {
    id: `${raw.countryCode}-${raw.date}-${raw.name}`,
    name: raw.name || 'Unnamed holiday',
    localName: raw.localName || '',
    date: raw.date,
    dateObj: date,
    month: date.getMonth(),
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
    countryCode: raw.countryCode,
    types: raw.types?.length ? raw.types : ['Public'],
    global: raw.global !== false,
    regions: raw.counties || [],
  };
}

/**
 * Public holidays for one country and year, sorted by date.
 * @returns {Promise<object[]>} an empty array when the API has no data
 */
export async function getHolidays(year, countryCode, signal) {
  const data = await request(`/PublicHolidays/${year}/${encodeURIComponent(countryCode)}`, { signal });
  return (data || []).map(normalizeHoliday).sort((a, b) => a.dateObj - b.dateObj);
}
