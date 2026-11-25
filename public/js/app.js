/**
 * app.js — application state and event wiring for Holiday Finder Rushikesh.
 * Fetching lives in api.js, persistence in storage.js, markup in ui.js.
 */

import { getCountries, getHolidays, ApiError, MIN_YEAR, MAX_YEAR } from './api.js';
import * as store from './storage.js';
import * as ui from './ui.js';
import { daysFromToday, holidaysToCsv, downloadFile, flagUrl, escapeHtml } from './utils.js';

/* ---------- DOM references ---------- */

const $ = (selector) => document.querySelector(selector);

const els = {
  form: $('#searchForm'),
  country: $('#countrySelect'),
  flag: $('#countryFlag'),
  year: $('#yearInput'),
  prevYear: $('#prevYear'),
  nextYear: $('#nextYear'),
  searchBtn: $('#searchBtn'),
  formError: $('#formError'),
  historySection: $('#historySection'),
  historyList: $('#historyList'),
  clearHistory: $('#clearHistory'),
  results: $('#results'),
  summary: $('#summary'),
  toolbar: $('#toolbar'),
  monthFilter: $('#monthFilter'),
  typeFilters: $('#typeFilters'),
  exportCsv: $('#exportCsv'),
  status: $('#status'),
  list: $('#holidayList'),
  themeToggle: $('#themeToggle'),
};

/* ---------- State ---------- */

const state = {
  countries: new Map(), // code -> name
  current: null, // { countryCode, countryName, year } of the last successful search
  holidays: [],
  month: 'all',
  types: new Set(), // empty = all types
  view: store.getView(),
  controller: null,
  retry: null, // what the "Try again" button should do
};

const thisYear = new Date().getFullYear();

/* ---------- Countries ---------- */

/** Pick a sensible default: the browser's region if supported, otherwise the United States. */
function defaultCountry() {
  const region = (navigator.language || '').split('-')[1]?.toUpperCase();
  return region && state.countries.has(region) ? region : 'US';
}

function loadCountries() {
  els.status.innerHTML = '';
  return getCountries()
    .then((countries) => {
      state.countries = new Map(countries.map((c) => [c.countryCode, c.name]));
      els.country.innerHTML = countries
        .map((c) => `<option value="${escapeHtml(c.countryCode)}">${escapeHtml(c.name)} (${escapeHtml(c.countryCode)})</option>`)
        .join('');
      els.country.disabled = false;
      restoreFromUrl();
    })
    .catch((error) => {
      console.error('Loading countries failed:', error);
      els.country.innerHTML = '<option value="">Countries unavailable</option>';
      state.retry = () => loadCountries();
      els.status.innerHTML = ui.statusMessage('error', error.message || 'Could not load the list of countries.');
    });
}

function updateFlag() {
  const code = els.country.value;
  if (!code) return els.flag.classList.add('hidden');
  els.flag.src = flagUrl(code);
  els.flag.classList.remove('hidden');
  els.country.classList.add('pl-12');
}

/* ---------- Searching ---------- */

function showFormError(message) {
  els.formError.textContent = message;
  els.formError.classList.remove('hidden');
}

function hideFormError() {
  els.formError.classList.add('hidden');
}

/** Validate the form values. Returns { countryCode, year } or null (after showing an error). */
function readForm() {
  const countryCode = els.country.value;
  const year = Number(els.year.value);
  if (!countryCode || !state.countries.has(countryCode)) {
    showFormError('Please choose a country.');
    els.country.focus();
    return null;
  }
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    showFormError(`Please enter a year between ${MIN_YEAR} and ${MAX_YEAR}.`);
    els.year.focus();
    return null;
  }
  hideFormError();
  return { countryCode, year };
}

/**
 * Fetch and show holidays. Any earlier request still in flight is aborted,
 * so fast clicking never shows results for the wrong country/year.
 */
async function search(countryCode, year) {
  const countryName = state.countries.get(countryCode) || countryCode;

  // keep the form in sync (important when searching from history)
  els.country.value = countryCode;
  els.year.value = year;
  updateFlag();

  state.controller?.abort();
  const controller = new AbortController();
  state.controller = controller;

  showLoading(countryName, year);
  syncUrl(countryCode, year);

  try {
    const holidays = await getHolidays(year, countryCode, controller.signal);
    state.holidays = holidays;
    state.current = { countryCode, countryName, year };
    state.month = 'all';
    state.types.clear();
    store.addToHistory({ countryCode, countryName, year, count: holidays.length });
    renderHistory();
    render();
  } catch (error) {
    if (error.name === 'AbortError') return; // replaced by a newer search
    console.error('Fetching holidays failed:', error);
    state.retry = () => search(countryCode, year);
    showError(error instanceof ApiError ? error.message : 'Something unexpected happened. Please try again.');
  } finally {
    if (state.controller === controller) {
      state.controller = null;
      els.searchBtn.disabled = false;
    }
  }
}

/* ---------- Rendering ---------- */

function hideResultsChrome() {
  els.summary.classList.add('hidden');
  els.toolbar.classList.add('hidden');
  els.toolbar.classList.remove('flex');
}

function showLoading(countryName, year) {
  els.searchBtn.disabled = true;
  hideResultsChrome();
  els.list.innerHTML = '';
  els.status.innerHTML = ui.loadingState(countryName, year);
}

function showError(message) {
  hideResultsChrome();
  els.list.innerHTML = '';
  els.status.innerHTML = ui.statusMessage('error', message);
}

/** Holidays with their "days from today", plus which one is the next upcoming. */
function withTiming(holidays) {
  const rows = holidays.map((h) => ({ h, days: daysFromToday(h.dateObj), isNext: false }));
  const next = rows.find((r) => r.days >= 0);
  if (next) next.isNext = true;
  return { rows, next };
}

function applyFilters(rows) {
  return rows.filter(({ h }) => {
    if (state.month !== 'all' && h.month !== Number(state.month)) return false;
    if (state.types.size && !h.types.some((t) => state.types.has(t))) return false;
    return true;
  });
}

function render() {
  const { countryCode, countryName, year } = state.current;

  if (!state.holidays.length) {
    hideResultsChrome();
    els.list.innerHTML = '';
    els.status.innerHTML = ui.statusMessage(
      'empty',
      `The holiday service has no data for ${countryName} in ${year}. Try another year, or a country such as the United Kingdom or Germany.`
    );
    return;
  }

  const { rows, next } = withTiming(state.holidays);
  const filtered = applyFilters(rows);

  els.summary.innerHTML = ui.summary({
    countryName,
    countryCode,
    year,
    total: rows.length,
    shown: filtered.length,
    upcomingCount: rows.filter((r) => r.days >= 0).length,
    next,
  });
  els.summary.classList.remove('hidden');

  els.monthFilter.innerHTML = ui.monthOptions(state.holidays, state.month);
  els.typeFilters.innerHTML = ui.typeChips(state.holidays, state.types);
  els.toolbar.classList.remove('hidden');
  els.toolbar.classList.add('flex');
  renderViewToggle();

  if (!filtered.length) {
    els.list.innerHTML = '';
    els.status.innerHTML = ui.statusMessage('filtered', 'Try another month or holiday type.');
    return;
  }

  els.status.innerHTML = '';
  els.list.innerHTML =
    state.view === 'table'
      ? ui.holidayTable(filtered)
      : `<div class="grid gap-4 md:grid-cols-2">${filtered.map((r, i) => ui.holidayCard(r.h, r, i)).join('')}</div>`;
}

function renderViewToggle() {
  document.querySelectorAll('.view-btn').forEach((btn) => {
    const active = btn.dataset.view === state.view;
    btn.setAttribute('aria-pressed', active);
    btn.className = `view-btn rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
      active ? 'bg-night-900 text-white dark:bg-sun-400 dark:text-night-950' : 'text-night-500 hover:text-night-900 dark:text-night-300 dark:hover:text-white'
    }`;
  });
}

function renderHistory() {
  const history = store.getHistory();
  els.historySection.classList.toggle('hidden', history.length === 0);
  els.historyList.innerHTML = ui.historyChips(history, state.current);
}

/* ---------- CSV export ---------- */

function exportCsv() {
  if (!state.current || !state.holidays.length) return;
  const rows = applyFilters(withTiming(state.holidays).rows).map((r) => r.h);
  const { countryCode, year } = state.current;
  const filtered = rows.length !== state.holidays.length ? '-filtered' : '';
  downloadFile(`holidays-${countryCode}-${year}${filtered}.csv`, holidaysToCsv(rows));
}

/* ---------- URL (shareable searches) ---------- */

function syncUrl(countryCode, year) {
  history.replaceState(null, '', `?country=${countryCode}&year=${year}`);
}

function restoreFromUrl() {
  const params = new URLSearchParams(location.search);
  const code = (params.get('country') || '').toUpperCase();
  const year = Number(params.get('year'));

  els.country.value = state.countries.has(code) ? code : defaultCountry();
  els.year.value = year >= MIN_YEAR && year <= MAX_YEAR ? year : thisYear;
  updateFlag();

  if (state.countries.has(code) && year) {
    search(code, Number(els.year.value));
  } else {
    els.status.innerHTML = ui.statusMessage('welcome', 'Your recent searches will appear above, ready to open again with one click.');
  }
}

/* ---------- Events ---------- */

function bindEvents() {
  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const values = readForm();
    if (values) search(values.countryCode, values.year);
  });

  els.country.addEventListener('change', () => {
    hideFormError();
    updateFlag();
  });

  const stepYear = (delta) => {
    const year = Math.min(MAX_YEAR, Math.max(MIN_YEAR, (Number(els.year.value) || thisYear) + delta));
    els.year.value = year;
    hideFormError();
    // if results are already showing, follow along automatically
    if (state.current && els.country.value) search(els.country.value, year);
  };
  els.prevYear.addEventListener('click', () => stepYear(-1));
  els.nextYear.addEventListener('click', () => stepYear(1));

  // History: re-run a previous search, or remove one entry
  els.historyList.addEventListener('click', (e) => {
    const again = e.target.closest('[data-history-country]');
    if (again) return search(again.dataset.historyCountry, Number(again.dataset.historyYear));

    const remove = e.target.closest('[data-remove-country]');
    if (remove) {
      store.removeFromHistory(remove.dataset.removeCountry, Number(remove.dataset.removeYear));
      renderHistory();
    }
  });

  els.clearHistory.addEventListener('click', () => {
    store.clearHistory();
    renderHistory();
  });

  // Filters
  els.monthFilter.addEventListener('change', () => {
    state.month = els.monthFilter.value;
    render();
  });

  els.typeFilters.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-type]');
    if (!chip) return;
    const { type } = chip.dataset;
    if (type === 'all') state.types.clear();
    else if (state.types.has(type)) state.types.delete(type);
    else state.types.add(type);
    render();
  });

  document.querySelectorAll('.view-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      store.saveView(state.view);
      render();
    })
  );

  els.exportCsv.addEventListener('click', exportCsv);

  // Buttons inside status messages
  els.results.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'retry' && state.retry) state.retry();
    if (action === 'reset-filters') {
      state.month = 'all';
      state.types.clear();
      render();
    }
  });

  els.themeToggle.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    store.saveTheme(dark ? 'dark' : 'light');
  });

  // Hide flag images that fail to load (error events don't bubble, so use capture)
  document.addEventListener(
    'error',
    (e) => {
      if (e.target instanceof HTMLImageElement && (e.target.dataset.flag !== undefined || e.target === els.flag)) {
        e.target.classList.add('hidden');
        if (e.target === els.flag) els.country.classList.remove('pl-12');
      }
    },
    true
  );
}

/* ---------- Boot ---------- */

els.year.value = thisYear;
els.year.min = MIN_YEAR;
els.year.max = MAX_YEAR;
bindEvents();
renderHistory();
loadCountries();
