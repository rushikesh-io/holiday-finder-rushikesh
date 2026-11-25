/**
 * "Year at a glance": twelve small month calendars with holidays circled in red.
 * - Clicking a month name filters the list to that month.
 * - Clicking a red date jumps to that holiday in the list.
 */

import { html } from '../utils/html.js';
import { MONTH_NAMES, WEEKDAY_INITIALS, monthGrid, isSameDay } from '../utils/dates.js';

function DayCell(year, month, day, holidaysByDay, today) {
  if (day === null) return html`<span></span>`;

  const date = new Date(year, month, day);
  const isToday = isSameDay(date, today);
  const todayRing = isToday ? 'ring-2 ring-marker ring-offset-1 ring-offset-surface' : '';
  const dayHolidays = holidaysByDay.get(day);

  if (!dayHolidays) {
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    return html`<span class="grid aspect-square place-items-center rounded-full ${weekend ? 'text-ink-faint' : 'text-ink-soft'} ${todayRing}">${day}</span>`;
  }

  const names = dayHolidays.map((h) => h.name).join(', ');
  const past = dayHolidays[0].isPast;
  return html`<a href="#${dayHolidays[0].id}" data-jump="${dayHolidays[0].id}" title="${names}"
      class="grid aspect-square place-items-center rounded-full font-semibold ${past ? 'bg-letter/45 text-white' : 'bg-letter text-white'} hover:ring-2 hover:ring-ink ${todayRing}"
      ><span class="sr-only">${names}, </span>${day}</a>`;
}

function MonthCard(year, month, holidays, selectedMonth, today) {
  const holidaysByDay = new Map();
  holidays.forEach((h) => {
    const day = h.date.getDate();
    holidaysByDay.set(day, [...(holidaysByDay.get(day) ?? []), h]);
  });
  const selected = selectedMonth === month;
  const count = holidays.length;

  return html`
    <div class="rounded-lg border ${selected ? 'border-ink' : 'border-rule'} bg-surface p-3">
      <button type="button" data-month="${month}" ${count ? '' : 'disabled'} aria-pressed="${selected}"
        class="mb-2 flex w-full items-baseline justify-between gap-2 text-left disabled:cursor-default"
        title="${count ? `Show only ${MONTH_NAMES[month]}` : `No holidays in ${MONTH_NAMES[month]}`}">
        <span class="font-display text-base font-bold ${count ? 'hover:underline' : 'text-ink-faint'}">${MONTH_NAMES[month]}</span>
        <span class="text-xs text-ink-faint">${count || 'none'}</span>
      </button>
      <div class="grid grid-cols-7 gap-0.5 text-center text-[11px] tabular-nums" role="presentation">
        ${WEEKDAY_INITIALS.map((d) => html`<span class="pb-0.5 font-medium text-ink-faint">${d}</span>`)}
        ${monthGrid(year, month).flat().map((day) => DayCell(year, month, day, holidaysByDay, today))}
      </div>
    </div>
  `;
}

export function YearCalendar({ year, holidays, selectedMonth, today = new Date() }) {
  return html`
    <section aria-labelledby="year-calendar-heading" class="mt-8">
      <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="year-calendar-heading" class="font-display text-xl font-bold">Year at a glance</h3>
        <p class="text-sm text-ink-soft">
          <span class="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-letter align-middle"></span>holiday
          <span class="ml-3 mr-1 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-marker align-middle"></span>today
        </p>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        ${MONTH_NAMES.map((_, month) =>
          MonthCard(year, month, holidays.filter((h) => h.month === month), selectedMonth, today)
        )}
      </div>
    </section>
  `;
}
