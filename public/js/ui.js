/**
 * ui.js — functions that turn data into HTML. No fetching and no state here
 * (that lives in app.js), which keeps every function easy to reuse and test.
 */

import { escapeHtml, formatLongDate, relativeDays, flagUrl, MONTHS } from './utils.js';

/* ---------- Holiday types ---------- */

/** Nager.Date holiday types, with a colour and a plain-English description each. */
const TYPE_META = {
  Public: { cls: 'bg-lagoon-100 text-lagoon-700 dark:bg-lagoon-500/15 dark:text-lagoon-400', desc: 'Public holiday' },
  Bank: { cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300', desc: 'Bank holiday: banks and offices are closed' },
  School: { cls: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', desc: 'School holiday: schools are closed' },
  Authorities: { cls: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', desc: 'Government offices are closed' },
  Optional: { cls: 'bg-sun-100 text-sun-700 dark:bg-sun-400/15 dark:text-sun-300', desc: 'Optional: most people may take the day off' },
  Observance: { cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', desc: 'Observance: a notable day, but not a day off' },
};
const FALLBACK_TYPE = { cls: 'bg-night-100 text-night-700 dark:bg-night-800 dark:text-night-200', desc: 'Holiday' };

function typeBadges(holiday) {
  const types = holiday.types
    .map((type) => {
      const meta = TYPE_META[type] || FALLBACK_TYPE;
      return `<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}" title="${escapeHtml(meta.desc)}">${escapeHtml(type)}</span>`;
    })
    .join('');

  const scope = holiday.global
    ? `<span class="rounded-full border border-night-200 px-2 py-0.5 text-[11px] font-semibold text-night-600 dark:border-night-700 dark:text-night-300" title="Observed across the whole country">National</span>`
    : `<span class="rounded-full border border-dashed border-night-300 px-2 py-0.5 text-[11px] font-semibold text-night-600 dark:border-night-600 dark:text-night-300" title="${escapeHtml(holiday.regions.join(', ') || 'Some regions only')}">Regional${holiday.regions.length ? ` · ${holiday.regions.length}` : ''}</span>`;

  return types + scope;
}

/* ---------- Upcoming / past status ---------- */

/**
 * @param {number} days  days from today (negative = past)
 * @param {boolean} isNext  the very next upcoming holiday
 */
function statusBadge(days, isNext) {
  if (days === 0) {
    return `<span class="inline-flex animate-pulse-ring items-center gap-1 rounded-full bg-sun-400 px-2.5 py-1 text-[11px] font-bold text-night-950">🎉 Today</span>`;
  }
  if (days > 0) {
    return isNext
      ? `<span class="rounded-full bg-sun-400 px-2.5 py-1 text-[11px] font-bold text-night-950">Next · ${relativeDays(days)}</span>`
      : `<span class="rounded-full bg-lagoon-100 px-2.5 py-1 text-[11px] font-semibold text-lagoon-700 dark:bg-lagoon-500/15 dark:text-lagoon-400">Upcoming · ${relativeDays(days)}</span>`;
  }
  return `<span class="rounded-full bg-night-100 px-2.5 py-1 text-[11px] font-semibold text-night-500 dark:bg-night-800 dark:text-night-400">Past</span>`;
}

/* ---------- Cards ---------- */

export function holidayCard(h, { days, isNext }, index = 0) {
  const upcoming = days >= 0;
  const highlight = isNext || days === 0;
  const showLocal = h.localName && h.localName !== h.name;

  return `
  <article class="panel relative flex gap-4 p-4 animate-rise ${highlight ? 'ring-2 ring-sun-400' : ''} ${upcoming ? '' : 'opacity-80'}"
    style="animation-delay:${Math.min(index, 14) * 30}ms">
    <div class="flex w-16 shrink-0 flex-col overflow-hidden rounded-2xl border border-night-100 text-center dark:border-night-700" aria-hidden="true">
      <span class="py-1 text-[11px] font-bold uppercase tracking-wider ${upcoming ? 'bg-sun-400 text-night-950' : 'bg-night-200 text-night-600 dark:bg-night-700 dark:text-night-200'}">${MONTHS[h.month].slice(0, 3)}</span>
      <span class="font-display text-2xl font-extrabold leading-tight pt-1">${h.dateObj.getDate()}</span>
      <span class="pb-1.5 text-[11px] font-medium text-night-500 dark:text-night-400">${h.weekday.slice(0, 3)}</span>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <h3 class="font-display text-base font-bold leading-snug sm:text-lg">${escapeHtml(h.name)}</h3>
        ${statusBadge(days, isNext)}
      </div>
      ${showLocal ? `<p class="mt-0.5 text-sm italic text-night-500 dark:text-night-300" lang="">${escapeHtml(h.localName)}</p>` : ''}

      <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-night-600 dark:text-night-300 sm:grid-cols-3">
        <div><dt class="font-semibold text-night-400">Date</dt><dd>${formatLongDate(h.dateObj)}</dd></div>
        <div><dt class="font-semibold text-night-400">Day</dt><dd>${h.weekday}</dd></div>
        <div><dt class="font-semibold text-night-400">Country code</dt><dd>${escapeHtml(h.countryCode)}</dd></div>
        <div class="col-span-2 sm:col-span-3"><dt class="font-semibold text-night-400">Local name</dt><dd>${escapeHtml(h.localName || 'Not available')}</dd></div>
      </dl>

      <div class="mt-3 flex flex-wrap gap-1.5">${typeBadges(h)}</div>
    </div>
  </article>`;
}

/* ---------- Table ---------- */

export function holidayTable(rows) {
  const body = rows
    .map(({ h, days, isNext }) => {
      const highlight = isNext || days === 0;
      return `
      <tr class="border-t border-night-100 dark:border-night-800 ${highlight ? 'bg-sun-50 dark:bg-sun-400/10' : ''} ${days < 0 ? 'text-night-400' : ''}">
        <td class="whitespace-nowrap px-4 py-3 font-semibold">${formatLongDate(h.dateObj)}</td>
        <td class="whitespace-nowrap px-4 py-3">${h.weekday}</td>
        <td class="px-4 py-3 font-medium">${escapeHtml(h.name)}</td>
        <td class="px-4 py-3 italic">${escapeHtml(h.localName || '—')}</td>
        <td class="px-4 py-3">${escapeHtml(h.countryCode)}</td>
        <td class="px-4 py-3"><div class="flex flex-wrap gap-1">${typeBadges(h)}</div></td>
        <td class="whitespace-nowrap px-4 py-3">${statusBadge(days, isNext)}</td>
      </tr>`;
    })
    .join('');

  return `
  <div class="panel overflow-x-auto">
    <table class="w-full min-w-[820px] text-left text-sm">
      <thead class="bg-night-50 text-xs uppercase tracking-wider text-night-500 dark:bg-night-800/60 dark:text-night-300">
        <tr>
          <th scope="col" class="px-4 py-3">Date</th>
          <th scope="col" class="px-4 py-3">Day</th>
          <th scope="col" class="px-4 py-3">Holiday name</th>
          <th scope="col" class="px-4 py-3">Local name</th>
          <th scope="col" class="px-4 py-3">Code</th>
          <th scope="col" class="px-4 py-3">Type</th>
          <th scope="col" class="px-4 py-3">Status</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  </div>`;
}

/* ---------- Summary ---------- */

export function summary({ countryName, countryCode, year, total, shown, upcomingCount, next }) {
  const nextText = next
    ? `<p class="font-display text-lg font-bold leading-snug">${escapeHtml(next.h.name)}</p>
       <p class="text-xs text-night-500 dark:text-night-300">${formatLongDate(next.h.dateObj)} · ${relativeDays(next.days)}</p>`
    : `<p class="font-display text-lg font-bold leading-snug">None left</p>
       <p class="text-xs text-night-500 dark:text-night-300">All holidays in ${year} have passed</p>`;

  return `
  <div class="mb-5 flex flex-wrap items-center gap-3">
    <img src="${flagUrl(countryCode, 80)}" alt="" class="h-8 w-12 rounded-md object-cover shadow-card" data-flag />
    <div>
      <h2 class="font-display text-2xl font-extrabold tracking-tight">${escapeHtml(countryName)} · ${year}</h2>
      <p class="text-sm text-night-500 dark:text-night-300">Public holidays from the Nager.Date API</p>
    </div>
  </div>
  <div class="mb-5 grid gap-3 sm:grid-cols-3">
    <div class="panel p-4">
      <p class="label mb-1">Holidays found</p>
      <p class="font-display text-3xl font-extrabold">${total}</p>
      <p class="text-xs text-night-500 dark:text-night-300">${shown === total ? 'Showing all' : `Showing ${shown} after filters`}</p>
    </div>
    <div class="panel p-4">
      <p class="label mb-1">Upcoming</p>
      <p class="font-display text-3xl font-extrabold text-lagoon-600 dark:text-lagoon-400">${upcomingCount}</p>
      <p class="text-xs text-night-500 dark:text-night-300">from today onwards</p>
    </div>
    <div class="panel border-sun-300 bg-sun-50 p-4 dark:border-sun-400/30 dark:bg-sun-400/10">
      <p class="label mb-1 text-sun-700 dark:text-sun-300">Next holiday</p>
      ${nextText}
    </div>
  </div>`;
}

/* ---------- Filters ---------- */

export function monthOptions(holidays, selected) {
  const counts = Array(12).fill(0);
  holidays.forEach((h) => counts[h.month]++);
  const options = MONTHS.map(
    (name, i) => `<option value="${i}" ${counts[i] ? '' : 'disabled'} ${String(i) === selected ? 'selected' : ''}>${name} (${counts[i]})</option>`
  ).join('');
  return `<option value="all" ${selected === 'all' ? 'selected' : ''}>All months (${holidays.length})</option>${options}`;
}

export function typeChips(holidays, activeTypes) {
  const counts = new Map();
  holidays.forEach((h) => h.types.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
  const allActive = activeTypes.size === 0;

  const chips = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => {
      const active = activeTypes.has(type);
      return `<button type="button" class="chip ${active ? 'chip-active' : ''}" data-type="${escapeHtml(type)}" aria-pressed="${active}"
        title="${escapeHtml((TYPE_META[type] || FALLBACK_TYPE).desc)}">${escapeHtml(type)} <span class="opacity-60">${count}</span></button>`;
    })
    .join('');

  return `<button type="button" class="chip ${allActive ? 'chip-active' : ''}" data-type="all" aria-pressed="${allActive}">All types</button>${chips}`;
}

/* ---------- Search history ---------- */

export function historyChips(history, current) {
  return history
    .map((entry) => {
      const isCurrent = current && entry.countryCode === current.countryCode && entry.year === current.year;
      return `
      <span class="chip ${isCurrent ? 'chip-active' : ''} pr-1.5">
        <button type="button" class="inline-flex items-center gap-1.5" data-history-country="${escapeHtml(entry.countryCode)}" data-history-year="${entry.year}"
          title="Search ${escapeHtml(entry.countryName)} ${entry.year} again">
          <img src="${flagUrl(entry.countryCode)}" alt="" class="h-3 w-[18px] rounded-[2px] object-cover" data-flag />
          ${escapeHtml(entry.countryName)} · ${entry.year}
        </button>
        <button type="button" class="ml-0.5 grid h-5 w-5 place-items-center rounded-full opacity-60 hover:bg-night-100 hover:opacity-100 dark:hover:bg-night-700"
          data-remove-country="${escapeHtml(entry.countryCode)}" data-remove-year="${entry.year}" aria-label="Remove ${escapeHtml(entry.countryName)} ${entry.year} from history">×</button>
      </span>`;
    })
    .join('');
}

/* ---------- Status messages ---------- */

export function loadingState(countryName, year) {
  const skeleton = `
    <div class="panel flex gap-4 p-4" aria-hidden="true">
      <div class="h-20 w-16 animate-pulse rounded-2xl bg-night-100 dark:bg-night-800"></div>
      <div class="flex-1 space-y-3 pt-1">
        <div class="h-4 w-3/5 animate-pulse rounded bg-night-100 dark:bg-night-800"></div>
        <div class="h-3 w-4/5 animate-pulse rounded bg-night-100 dark:bg-night-800"></div>
        <div class="h-3 w-2/5 animate-pulse rounded bg-night-100 dark:bg-night-800"></div>
      </div>
    </div>`;
  return `
    <div class="mb-5 flex items-center justify-center gap-3 text-sm font-medium text-night-600 dark:text-night-300" role="status">
      <span class="h-5 w-5 animate-spin rounded-full border-2 border-sun-500 border-t-transparent"></span>
      Fetching holidays for ${escapeHtml(countryName)} in ${year}…
    </div>
    <div class="grid gap-4 md:grid-cols-2">${skeleton.repeat(6)}</div>`;
}

/**
 * @param {'empty'|'filtered'|'error'|'welcome'} kind
 */
export function statusMessage(kind, detail = '') {
  const content = {
    empty: { icon: '🗓️', title: 'No holidays found for the selected country and year.' },
    filtered: { icon: '🔍', title: 'No holidays match these filters.' },
    error: { icon: '⚠️', title: 'Something went wrong' },
    welcome: { icon: '✨', title: 'Choose a country and year to get started' },
  }[kind];

  return `
    <div class="mx-auto max-w-lg rounded-3xl border border-dashed border-night-200 px-6 py-12 text-center dark:border-night-700" ${kind === 'error' ? 'role="alert"' : ''}>
      <div class="text-4xl" aria-hidden="true">${content.icon}</div>
      <p class="mt-3 font-display text-xl font-bold">${escapeHtml(content.title)}</p>
      ${detail ? `<p class="mt-2 text-sm text-night-600 dark:text-night-300">${escapeHtml(detail)}</p>` : ''}
      ${kind === 'error' ? '<button type="button" data-action="retry" class="btn-sun mt-5">Try again</button>' : ''}
      ${kind === 'filtered' ? '<button type="button" data-action="reset-filters" class="btn-ghost mt-5">Clear filters</button>' : ''}
    </div>`;
}
