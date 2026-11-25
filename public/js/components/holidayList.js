/**
 * The main list: holidays grouped by month, laid out like a printed planner.
 * Upcoming dates are printed in calendar red; the next holiday gets a highlighter mark.
 */

import { html } from '../utils/html.js';
import { MONTH_NAMES, formatLongDate } from '../utils/dates.js';
import { groupByMonth } from '../features/holidays.js';
import { HolidayTags, HolidayStatus } from './shared.js';

function HolidayRow(holiday) {
  const highlighted = holiday.isNext || holiday.isToday;

  return html`
    <article id="${holiday.id}" class="grid grid-cols-[3.75rem_1fr] gap-4 border-t border-rule py-4 first:border-t-0 sm:grid-cols-[4.5rem_1fr]
      ${highlighted ? '-mx-3 rounded-md border-transparent bg-marker-soft px-3' : ''}">
      <div class="text-center">
        <p class="font-display text-4xl font-extrabold leading-none tabular-nums ${holiday.isPast ? 'text-ink-faint' : 'text-letter'}">${holiday.date.getDate()}</p>
        <p class="mt-1 text-xs font-medium text-ink-soft">${holiday.weekday.slice(0, 3)}</p>
      </div>

      <div class="min-w-0">
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h4 class="text-lg font-semibold leading-snug">${holiday.name}</h4>
          ${HolidayStatus(holiday)}
        </div>

        <dl class="mt-1.5 grid gap-x-6 gap-y-0.5 text-sm text-ink-soft sm:grid-cols-[auto_auto_1fr]">
          <div><dt class="sr-only">Date</dt><dd>${formatLongDate(holiday.date)}</dd></div>
          <div><dt class="inline">Local name: </dt><dd class="inline" lang="">${holiday.localName || 'not available'}</dd></div>
          <div><dt class="inline">Country code: </dt><dd class="inline">${holiday.countryCode}</dd></div>
        </dl>

        <div class="mt-2.5 flex flex-wrap gap-1.5">${HolidayTags(holiday)}</div>
      </div>
    </article>
  `;
}

export function HolidayList(holidays) {
  return groupByMonth(holidays).map(
    ({ month, holidays: items }) => html`
      <section class="mt-8 border-t-2 border-ink pt-3 lg:grid lg:grid-cols-[11rem_1fr] lg:gap-8" aria-label="${MONTH_NAMES[month]}">
        <h3 class="mb-1 self-start font-display text-2xl font-bold lg:sticky lg:top-20">
          ${MONTH_NAMES[month]}
          <span class="block text-sm font-medium text-ink-faint">${items.length} ${items.length === 1 ? 'holiday' : 'holidays'}</span>
        </h3>
        <div>${items.map(HolidayRow)}</div>
      </section>
    `
  );
}
