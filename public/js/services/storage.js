/**
 * localStorage access for search history and preferences.
 * Storage can be unavailable (private browsing, blocked cookies), so every call
 * is wrapped and the app simply carries on without persistence.
 */

import { STORAGE_KEYS, MAX_HISTORY_ITEMS } from '../config.js';

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeRaw(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: nothing to do */
  }
}

/* ---------- Search history ---------- */

/** @typedef {{ countryCode: string, countryName: string, year: number, count: number }} HistoryEntry */

/** @returns {HistoryEntry[]} newest first */
export function loadHistory() {
  const list = readJson(STORAGE_KEYS.history, []);
  return Array.isArray(list) ? list.filter((e) => e && e.countryCode && Number.isInteger(e.year)) : [];
}

const sameSearch = (a, b) => a.countryCode === b.countryCode && a.year === b.year;

/** Put a search at the top of the history, removing any older copy of it. */
export function saveToHistory(entry) {
  const list = [entry, ...loadHistory().filter((e) => !sameSearch(e, entry))].slice(0, MAX_HISTORY_ITEMS);
  writeRaw(STORAGE_KEYS.history, JSON.stringify(list));
  return list;
}

export function removeFromHistory(entry) {
  const list = loadHistory().filter((e) => !sameSearch(e, entry));
  writeRaw(STORAGE_KEYS.history, JSON.stringify(list));
  return list;
}

export function clearHistory() {
  writeRaw(STORAGE_KEYS.history, null);
}

/* ---------- Preferences ---------- */

/** Stored as plain text because index.html reads it before any module loads. */
export const saveTheme = (theme) => writeRaw(STORAGE_KEYS.theme, theme);

export function loadView() {
  try {
    return localStorage.getItem(STORAGE_KEYS.view) === 'table' ? 'table' : 'list';
  } catch {
    return 'list';
  }
}

export const saveView = (view) => writeRaw(STORAGE_KEYS.view, view);
