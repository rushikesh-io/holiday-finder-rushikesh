/**
 * Entry point: holds the app state, connects user actions to the services,
 * and decides what to render. Markup lives in /components, logic in /features.
 */

import { YEAR_MIN, YEAR_MAX, DEFAULT_COUNTRY } from './config.js';
import { fetchCountries, fetchPublicHolidays, ApiError } from './services/holidayApi.js';
import * as storage from './services/storage.js';
import { toHolidays, annotate, filterHolidays, holidaysToCsv } from './features/holidays.js';
import { html, mount } from './utils/html.js';
import { downloadText } from './utils/csv.js';
import { flagUrl } from './components/shared.js';
import { Summary } from './components/summary.js';
import { YearCalendar } from './components/yearCalendar.js';
import { TypeToggles, MonthOptions } from './components/filters.js';
import { HolidayList } from './components/holidayList.js';
import { HolidayTable } from './components/holidayTable.js';
import { SearchHistory } from './components/searchHistory.js';
import { Loading, NoHolidays, NoFilterMatches, ErrorMessage, Welcome } from './components/statusMessages.js';

/* ---------- Elements ---------- */

const $ = (id) => document.getElementById(id);
const el = {
  form: $('searchForm'),
  country: $('countrySelect'),
  flag: $('countryFlag'),
  year: $('yearInput'),
  prevYear: $('prevYear'),
  nextYear: $('nextYear'),
  searchButton: $('searchButton'),
  formError: $('formError'),
  historySection: $('historySection'),
  historyList: $('historyList'),
  clearHistory: $('clearHistory'),
  results: $('results'),
  summary: $('summary'),
  yearCalendar: $('yearCalendar'),
  toolbar: $('toolbar'),
  monthFilter: $('monthFilter'),
  typeFilters: $('typeFilters'),
  shownCount: $('shownCount'),
  exportCsv: $('exportCsv'),
  status: $('status'),
  list: $('holidayList'),
  themeToggle: $('themeToggle'),
};

/* ---------- State ---------- */

const state = {
  countries: new Map(), // code -> name
  search: null, // { countryCode, countryName, year } currently shown
  holidays: [], // annotated holidays for the current search
  month: 'all', // 'all' or 0–11
  types: new Set(), // empty = every type
  view: storage.loadView(),
  request: null, // AbortController of the request in flight
  retry: null, // what "Try again" should do
};

const currentYear = new Date().getFullYear();

/* ---------- Countries ---------- */

function loadCountries() {
  mount(el.status, null);
  return fetchCountries()
    .then((countries) => {
      state.countries = new Map(countries.map((c) => [c.code, c.name]));
      mount(el.country, html`${countries.map((c) => html`<option value="${c.code}">${c.name}</option>`)}`);
      el.country.disabled = false;
      startFromUrl();
    })
    .catch((error) => {
      console.error('Loading countries failed:', error);
      mount(el.country, html`<option value="">Countries unavailable</option>`);
      state.retry = loadCountries;
      mount(el.status, ErrorMessage(error.message));
    });
}

function showFlag() {
  const code = el.country.value;
  el.flag.classList.toggle('hidden', !code);
  el.country.classList.toggle('pl-11', Boolean(code));
  if (code) el.flag.src = flagUrl(code);
}

/* ---------- Search ---------- */

function setFormError(message) {
  el.formError.textContent = message ?? '';
  el.formError.classList.toggle('hidden', !message);
}

/** @returns {{ countryCode: string, year: number } | null} */
function readForm() {
  const countryCode = el.country.value;
  const year = Number(el.year.value);
  if (!state.countries.has(countryCode)) {
    setFormError('Choose a country from the list.');
    el.country.focus();
    return null;
  }
  if (!Number.isInteger(year) || year < YEAR_MIN || year > YEAR_MAX) {
    setFormError(`Enter a year from ${YEAR_MIN} to ${YEAR_MAX}.`);
    el.year.focus();
    return null;
  }
  setFormError(null);
  return { countryCode, year };
}

/**
 * Fetch and show holidays for a country and year.
 * A newer search cancels an older one, so results never arrive out of order.
 */
async function search(countryCode, year) {
  const countryName = state.countries.get(countryCode) ?? countryCode;
  el.country.value = countryCode;
  el.year.value = year;
  showFlag();

  state.request?.abort();
  const request = new AbortController();
  state.request = request;

  showLoading(countryName, year);
  history.replaceState(null, '', `?country=${countryCode}&year=${year}`);

  try {
    const raw = await fetchPublicHolidays(year, countryCode, { signal: request.signal });
    state.search = { countryCode, countryName, year };
    state.holidays = annotate(toHolidays(raw));
    state.month = 'all';
    state.types.clear();
    storage.saveToHistory({ countryCode, countryName, year, count: raw.length });
    renderHistory();
    render();
  } catch (error) {
    if (error.name === 'AbortError') return; // replaced by a newer search
    console.error('Loading holidays failed:', error);
    state.retry = () => search(countryCode, year);
    showError(error instanceof ApiError ? error.message : 'Something unexpected went wrong. Try again.');
  } finally {
    if (state.request === request) {
      state.request = null;
      el.searchButton.disabled = false;
      el.results.setAttribute('aria-busy', 'false');
    }
  }
}

/* ---------- Rendering ---------- */

function clearResults() {
  mount(el.summary, null);
  mount(el.yearCalendar, null);
  mount(el.list, null);
  el.toolbar.classList.add('hidden');
  el.toolbar.classList.remove('flex');
}

function showLoading(countryName, year) {
  el.searchButton.disabled = true;
  el.results.setAttribute('aria-busy', 'true');
  clearResults();
  mount(el.status, Loading(countryName, year));
}

function showError(message) {
  clearResults();
  mount(el.status, ErrorMessage(message));
}

function render() {
  const { countryCode, countryName, year } = state.search;

  if (!state.holidays.length) {
    clearResults();
    mount(el.status, NoHolidays(countryName, year));
    return;
  }

  const visible = filterHolidays(state.holidays, { month: state.month, types: state.types });

  mount(el.summary, Summary({ countryCode, countryName, year, holidays: state.holidays }));
  mount(el.yearCalendar, YearCalendar({ year, holidays: state.holidays, selectedMonth: state.month }));
  mount(el.monthFilter, MonthOptions(state.holidays, state.month));
  mount(el.typeFilters, TypeToggles(state.holidays, state.types));
  el.shownCount.textContent =
    visible.length === state.holidays.length ? `${visible.length} shown` : `${visible.length} of ${state.holidays.length} shown`;
  document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
  el.toolbar.classList.remove('hidden');
  el.toolbar.classList.add('flex');

  if (!visible.length) {
    mount(el.list, null);
    mount(el.status, NoFilterMatches());
    return;
  }
  mount(el.status, null);
  mount(el.list, state.view === 'table' ? HolidayTable(visible) : html`${HolidayList(visible)}`);
}

function renderHistory() {
  const entries = storage.loadHistory();
  el.historySection.classList.toggle('hidden', entries.length === 0);
  mount(el.historyList, html`${SearchHistory(entries, state.search)}`);
}

/* ---------- Actions ---------- */

function setMonth(month) {
  state.month = month;
  render();
}

function resetFilters() {
  state.month = 'all';
  state.types.clear();
  render();
}

/** Scroll to a holiday in the list and flash it (from the year calendar). */
function jumpToHoliday(id) {
  if (state.month !== 'all' || state.types.size) resetFilters();
  const target = document.getElementById(id);
  if (!target) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  target.classList.remove('flash');
  void target.offsetWidth; // restart the animation if clicked twice
  target.classList.add('flash');
}

function exportCsv() {
  if (!state.search) return;
  const visible = filterHolidays(state.holidays, { month: state.month, types: state.types });
  const { countryCode, year } = state.search;
  const suffix = visible.length < state.holidays.length ? '-filtered' : '';
  downloadText(`holidays-${countryCode}-${year}${suffix}.csv`, holidaysToCsv(visible));
}

/** Pre-fill from the URL (?country=GB&year=2026) and search, or show the welcome message. */
function startFromUrl() {
  const params = new URLSearchParams(location.search);
  const code = (params.get('country') ?? '').toUpperCase();
  const year = Number(params.get('year'));
  const region = (navigator.language.split('-')[1] ?? '').toUpperCase();

  el.country.value = state.countries.has(code) ? code : state.countries.has(region) ? region : DEFAULT_COUNTRY;
  el.year.value = year >= YEAR_MIN && year <= YEAR_MAX ? year : currentYear;
  showFlag();

  if (state.countries.has(code) && year) search(code, Number(el.year.value));
  else mount(el.status, Welcome());
}

/* ---------- Events ---------- */

function bindEvents() {
  el.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = readForm();
    if (values) search(values.countryCode, values.year);
  });

  el.country.addEventListener('change', () => {
    setFormError(null);
    showFlag();
  });

  const stepYear = (delta) => {
    const year = Math.min(YEAR_MAX, Math.max(YEAR_MIN, (Number(el.year.value) || currentYear) + delta));
    el.year.value = year;
    setFormError(null);
    if (state.search) search(el.country.value, year); // results on screen follow the year
  };
  el.prevYear.addEventListener('click', () => stepYear(-1));
  el.nextYear.addEventListener('click', () => stepYear(1));

  el.historyList.addEventListener('click', (event) => {
    const open = event.target.closest('[data-open-country]');
    if (open) return search(open.dataset.openCountry, Number(open.dataset.openYear));

    const remove = event.target.closest('[data-remove-country]');
    if (remove) {
      storage.removeFromHistory({ countryCode: remove.dataset.removeCountry, year: Number(remove.dataset.removeYear) });
      renderHistory();
    }
  });

  el.clearHistory.addEventListener('click', () => {
    storage.clearHistory();
    renderHistory();
  });

  el.monthFilter.addEventListener('change', () => setMonth(el.monthFilter.value === 'all' ? 'all' : Number(el.monthFilter.value)));

  el.typeFilters.addEventListener('click', (event) => {
    const type = event.target.closest('[data-type]')?.dataset.type;
    if (!type) return;
    if (type === 'all') state.types.clear();
    else if (state.types.has(type)) state.types.delete(type);
    else state.types.add(type);
    render();
  });

  el.toolbar.addEventListener('click', (event) => {
    const view = event.target.closest('[data-view]')?.dataset.view;
    if (!view || view === state.view) return;
    state.view = view;
    storage.saveView(view);
    render();
  });

  el.exportCsv.addEventListener('click', exportCsv);

  el.yearCalendar.addEventListener('click', (event) => {
    const jump = event.target.closest('[data-jump]');
    if (jump) {
      event.preventDefault();
      return jumpToHoliday(jump.dataset.jump);
    }
    const monthButton = event.target.closest('[data-month]');
    if (monthButton) {
      const month = Number(monthButton.dataset.month);
      setMonth(state.month === month ? 'all' : month); // click again to show all months
    }
  });

  el.results.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'retry') state.retry?.();
    if (action === 'reset-filters') resetFilters();
  });

  el.themeToggle.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    storage.saveTheme(dark ? 'dark' : 'light');
  });

  // Hide any flag image that fails to load (error events don't bubble, so listen while capturing).
  document.addEventListener(
    'error',
    (event) => {
      const img = event.target;
      if (img instanceof HTMLImageElement && 'flag' in img.dataset) {
        img.classList.add('hidden');
        if (img === el.flag) el.country.classList.remove('pl-11');
      }
    },
    true
  );
}

/* ---------- Start ---------- */

el.year.min = YEAR_MIN;
el.year.max = YEAR_MAX;
el.year.value = currentYear;
bindEvents();
renderHistory();
loadCountries();
