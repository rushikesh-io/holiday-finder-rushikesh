/**
 * Filter controls: holiday type toggles and the month dropdown options.
 */

import { html } from '../utils/html.js';
import { MONTH_NAMES } from '../utils/dates.js';
import { HOLIDAY_TYPES } from '../config.js';
import { countTypes, countByMonth } from '../features/holidays.js';

export function TypeToggles(holidays, activeTypes) {
  const counts = countTypes(holidays);
  // With only one type there is nothing to filter, so show a plain note instead.
  if (counts.length < 2) {
    return html`<span class="text-sm text-ink-soft">All are ${counts[0]?.[0] ?? 'public'} holidays</span>`;
  }

  return html`
    <button type="button" class="toggle" data-type="all" aria-pressed="${activeTypes.size === 0}">All types</button>
    ${counts.map(
      ([type, count]) => html`<button type="button" class="toggle" data-type="${type}" aria-pressed="${activeTypes.has(type)}"
        title="${HOLIDAY_TYPES[type] ?? type}">${type} <span class="opacity-60">${count}</span></button>`
    )}
  `;
}

export function MonthOptions(holidays, selectedMonth) {
  const counts = countByMonth(holidays);
  return html`
    <option value="all" ${selectedMonth === 'all' ? 'selected' : ''}>All months</option>
    ${MONTH_NAMES.map(
      (name, month) => html`<option value="${month}" ${counts[month] ? '' : 'disabled'} ${selectedMonth === month ? 'selected' : ''}>${name} (${counts[month]})</option>`
    )}
  `;
}
