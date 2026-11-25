/**
 * Nager.Date API client — the only module that talks to the network.
 * Docs: https://date.nager.at/Api
 */

import { API_BASE_URL, YEAR_MIN, YEAR_MAX } from '../config.js';

/** An error whose message is written for the person using the app. */
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const STATUS_MESSAGES = {
  400: `That year isn't supported. Choose a year from ${YEAR_MIN} to ${YEAR_MAX}.`,
  404: "That country isn't supported by the holiday service.",
  429: 'Too many requests in a short time. Wait a moment, then try again.',
};

/**
 * GET a path from the API.
 * Resolves to parsed JSON, or `null` when the API replies "204 No Content"
 * (which is how it says "no holidays for this country and year").
 */
async function getJson(path, { signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError("Couldn't reach the holiday service. Check your internet connection, then try again.");
  }

  if (response.status === 204) return null;
  if (!response.ok) {
    throw new ApiError(
      STATUS_MESSAGES[response.status] ?? `The holiday service returned an error (${response.status}). Try again.`,
      response.status
    );
  }

  const body = await response.text();
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    throw new ApiError('The holiday service sent a response the app could not read. Try again.', response.status);
  }
}

/**
 * Countries the API has data for, sorted by name.
 * @returns {Promise<{ code: string, name: string }[]>}
 */
export function fetchCountries({ signal } = {}) {
  return getJson('/AvailableCountries', { signal })
    .then((list) =>
      (list ?? []).map(({ countryCode, name }) => ({ code: countryCode, name })).sort((a, b) => a.name.localeCompare(b.name))
    )
    .catch((error) => {
      if (error.name === 'AbortError' || error instanceof ApiError) throw error;
      throw new ApiError("Couldn't load the list of countries. Try again.");
    });
}

/**
 * Raw public holidays for one country and year ([] when the API has none).
 * @returns {Promise<object[]>}
 */
export async function fetchPublicHolidays(year, countryCode, { signal } = {}) {
  const data = await getJson(`/PublicHolidays/${year}/${encodeURIComponent(countryCode)}`, { signal });
  return data ?? [];
}
