/**
 * Results heading plus a one-paragraph summary written as a sentence:
 * total holidays, how many are left, the next one and long weekends.
 */

import { html } from '../utils/html.js';
import { formatLongDate, describeDistance } from '../utils/dates.js';
import { Flag } from './shared.js';

export function Summary({ countryCode, countryName, year, holidays }) {
  const total = holidays.length;
  const upcoming = holidays.filter((h) => !h.isPast);
  const next = holidays.find((h) => h.isNext);
  const longWeekends = holidays.filter((h) => h.isLongWeekend).length;

  let outlook;
  if (next?.isToday) {
    outlook = html`Today is <strong>${next.name}</strong>.`;
  } else if (next) {
    outlook = html`${upcoming.length} still to come. The next is <strong>${next.name}</strong> on ${formatLongDate(next.date)}, ${describeDistance(next.daysAway)}.`;
  } else {
    outlook = html`All of them have passed.`;
  }

  return html`
    <div class="flex items-center gap-3">
      ${Flag(countryCode, 'h-7 w-10')}
      <h2 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">${countryName}, ${year}</h2>
    </div>
    <p class="mt-3 max-w-prose text-lg leading-relaxed text-ink-soft">
      <strong class="text-ink">${total} ${total === 1 ? 'holiday' : 'holidays'}</strong> found. ${outlook}
      ${longWeekends ? html` ${longWeekends} of them make a long weekend.` : ''}
    </p>
  `;
}
