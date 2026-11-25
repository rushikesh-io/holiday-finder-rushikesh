/**
 * Table layout: the same data in rows and columns, good for scanning and comparing.
 * Scrolls sideways inside its own box on small screens.
 */

import { html } from '../utils/html.js';
import { formatShortDate } from '../utils/dates.js';
import { HolidayTags, HolidayStatus } from './shared.js';

const COLUMNS = ['Date', 'Day', 'Holiday name', 'Local name', 'Code', 'Type', 'Status'];

export function HolidayTable(holidays) {
  return html`
    <div class="mt-6 overflow-x-auto rounded-lg border border-rule bg-surface">
      <table class="w-full min-w-[860px] text-left text-sm">
        <thead class="border-b border-rule bg-paper-deep text-ink-soft">
          <tr>${COLUMNS.map((c) => html`<th scope="col" class="px-4 py-3 font-semibold">${c}</th>`)}</tr>
        </thead>
        <tbody>
          ${holidays.map(
            (h) => html`
              <tr id="${h.id}" class="border-t border-rule first:border-t-0 ${h.isNext || h.isToday ? 'bg-marker-soft' : ''} ${h.isPast ? 'text-ink-faint' : ''}">
                <td class="whitespace-nowrap px-4 py-3 font-semibold tabular-nums ${h.isPast ? '' : 'text-letter'}">${formatShortDate(h.date)}</td>
                <td class="whitespace-nowrap px-4 py-3">${h.weekday}</td>
                <td class="px-4 py-3 font-medium">${h.name}</td>
                <td class="px-4 py-3" lang="">${h.localName || 'not available'}</td>
                <td class="px-4 py-3">${h.countryCode}</td>
                <td class="px-4 py-3"><div class="flex flex-wrap gap-1">${HolidayTags(h)}</div></td>
                <td class="whitespace-nowrap px-4 py-3">${HolidayStatus(h)}</td>
              </tr>
            `
          )}
        </tbody>
      </table>
    </div>
  `;
}
