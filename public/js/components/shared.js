/**
 * Small pieces of markup used by several components.
 */

import { html } from '../utils/html.js';
import { HOLIDAY_TYPES } from '../config.js';
import { describeDistance } from '../utils/dates.js';

export const flagUrl = (countryCode, width = 40) => `https://flagcdn.com/w${width}/${countryCode.toLowerCase()}.png`;

/** Decorative flag image; hidden automatically if it fails to load (see main.js). */
export function Flag(countryCode, className = 'h-4 w-6') {
  return html`<img src="${flagUrl(countryCode, 80)}" alt="" data-flag class="${className} shrink-0 rounded-sm object-cover ring-1 ring-ink/10" />`;
}

/** Type tags plus the nationwide/regional tag for one holiday. */
export function HolidayTags(holiday) {
  return html`
    ${holiday.types.map(
      (type) => html`<span class="tag ${type === 'Public' ? 'border-letter/40 text-letter' : 'border-rule text-ink-soft'}"
        title="${HOLIDAY_TYPES[type] ?? type}">${type}</span>`
    )}
    ${holiday.nationwide
      ? html`<span class="tag border-rule text-ink-soft" title="Observed across the whole country">Nationwide</span>`
      : html`<span class="tag border-dashed border-rule text-ink-soft" title="${holiday.regions.join(', ') || 'Some regions only'}">Regional${
          holiday.regions.length ? ` (${holiday.regions.length} regions)` : ''
        }</span>`}
    ${holiday.isLongWeekend
      ? html`<span class="tag border-marker bg-marker-soft text-ink" title="Falls on a ${holiday.weekday}, next to the weekend">Long weekend</span>`
      : ''}
    ${holiday.isWeekend ? html`<span class="tag border-rule text-ink-faint">Falls on a ${holiday.weekday}</span>` : ''}
  `;
}

/** "Today", "Next holiday, in 5 days", "In 12 days" or "Passed". */
export function HolidayStatus(holiday) {
  if (holiday.isToday) return html`<span class="rounded bg-marker px-2 py-0.5 text-sm font-semibold text-[#1F2A30]">Today</span>`;
  if (holiday.isNext) {
    return html`<span class="text-sm font-semibold text-ink">Next holiday, ${describeDistance(holiday.daysAway)}</span>`;
  }
  if (holiday.isPast) return html`<span class="text-sm text-ink-faint">Passed</span>`;
  const distance = describeDistance(holiday.daysAway);
  return html`<span class="text-sm text-ink-soft">${distance[0].toUpperCase()}${distance.slice(1)}</span>`;
}
