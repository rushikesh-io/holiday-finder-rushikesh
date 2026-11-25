/**
 * storage.js — search history, theme and layout preference in localStorage.
 * Every access is wrapped in try/catch: storage can be blocked (private mode),
 * and the app must keep working without it.
 */

const PREFIX = 'holiday-finder-rushikesh:';
const HISTORY_KEY = `${PREFIX}history`;
const THEME_KEY = `${PREFIX}theme`;
const VIEW_KEY = `${PREFIX}view`;
const MAX_HISTORY = 8;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore — the feature just won't persist */
  }
}

/** @returns {{countryCode: string, countryName: string, year: number, count: number}[]} newest first */
export function getHistory() {
  const list = read(HISTORY_KEY, []);
  return Array.isArray(list) ? list : [];
}

/** Add a search to the top of the history (moving it up if it already exists). */
export function addToHistory(entry) {
  const rest = getHistory().filter((h) => !(h.countryCode === entry.countryCode && h.year === entry.year));
  const list = [{ ...entry, searchedAt: Date.now() }, ...rest].slice(0, MAX_HISTORY);
  write(HISTORY_KEY, list);
  return list;
}

export function removeFromHistory(countryCode, year) {
  const list = getHistory().filter((h) => !(h.countryCode === countryCode && h.year === year));
  write(HISTORY_KEY, list);
  return list;
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

/** Stored as plain text ("dark"/"light") because index.html reads it before any JS module loads. */
export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}
export const getView = () => (read(VIEW_KEY, 'cards') === 'table' ? 'table' : 'cards');
export const saveView = (view) => write(VIEW_KEY, view);
